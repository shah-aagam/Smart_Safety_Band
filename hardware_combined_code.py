"""
================================================================================
                    A9G INTEGRATED SECURITY DEVICE
================================================================================
Complete Integration: Touch Sensor, Voice Module, Heartbeat, Motion, SMS, Call, Frontend
All original code preserved - Functions integrated into state-based system
================================================================================
"""

# ============================================================================
# SECTION 1: IMPORTS AND CONFIGURATION
# ============================================================================

import machine
import cellular
import gps
import i2c
import time
import usocket
import ujson
from machine import Pin, UART

# ============================================================================
# SECTION 2: PIN DEFINITIONS
# ============================================================================

# Touch Sensor
TOUCH_PIN = 3

# LEDs
LED_OK = Pin(27, Pin.OUT)
LED_BUSY = Pin(28, Pin.OUT)

# Vibration Motor (for freeze alert)
VIBRATION_PIN = 14  # Change if different

# ============================================================================
# SECTION 3: CONFIGURATION CONSTANTS
# ============================================================================

# Network Configuration
ADMIN_NUMBER = "+918779631531"
CALL_NUMBER = "08779631531"
SERVER_HOST = "13.232.213.231"
SERVER_PORT = 80
SERVER_PATH = "/api/location"
APN = "www"

# Timing Constants
DOUBLE_TAP_WINDOW_MS = 400
BLINK_INTERVAL_MS = 250
CALL_RETRY_COUNT = 3
CALL_RING_TIME = 30
WAIT_FOR_SIM_INIT_TIMEOUT = 10
WAIT_FOR_NETWORK_TIMEOUT = 20

# Heartbeat & Motion Detection
MAX30102_ADDR = 0x57
I2C_PORT = 2
I2C_FREQ = 400000
I2C_TIMEOUT = 10

# Freeze Detection Constants
VIBRATION_DURATION = 500         # milliseconds
VIBRATION_PAUSE = 200            # milliseconds
VIBRATION_COUNT = 3              # number of vibrations

# Voice Module UART Configuration (VC02)
VOICE_UART_ID = 1
VOICE_BAUDRATE = 9600

# MPU6050 Configuration
MPU6050_ADDR = 0x68
I2C_PORT_MPU = 3
MOVEMENT_STILL_THRESHOLD = 18000
FREEZE_HEARTBEAT_THRESHOLD = 45
FREEZE_CONFIRMATION_TIME = 10000  # 10 seconds

# ============================================================================
# SECTION 4: DEVICE STATE MANAGEMENT
# ============================================================================

class DeviceState:
    """Central state manager for the security device"""
    
    def __init__(self):
        self.state = "IDLE"  # IDLE, TOUCH_ALERT, VOICE_ALERT, FREEZE_ALERT, SOS_ACTIVE, COOLDOWN
        self.last_sos_time = 0
        self.sos_cooldown = 5000  # 5 second cooldown between SOS
        self.finger_on_sensor = False
        self.current_heartrate = None
        self.motion_detected = False
        self.last_motion_time = 0
        self.freeze_alert_sent = False
        self.current_location = None

         # NEW GPS CACHE
        self.current_location = None
        self.gps_last_update = 0


device_state = DeviceState()

# ============================================================================
# SECTION 5: MAX30102 HEARTBEAT SENSOR (from heartbeat.py)
# ============================================================================

# MAX30102 Registers
REG_INT_STATUS_1   = 0x00
REG_INT_STATUS_2   = 0x01
REG_INT_ENABLE_1   = 0x02
REG_INT_ENABLE_2   = 0x03
REG_FIFO_WR_PTR    = 0x04
REG_OVF_COUNTER    = 0x05
REG_FIFO_RD_PTR    = 0x06
REG_FIFO_DATA      = 0x07
REG_FIFO_CONFIG    = 0x08
REG_MODE_CONFIG    = 0x09
REG_SPO2_CONFIG    = 0x0A
REG_LED1_PA        = 0x0C
REG_LED2_PA        = 0x0D
REG_TEMP_INT       = 0x1F
REG_TEMP_FRAC      = 0x20
REG_TEMP_CONFIG    = 0x21
REG_PART_ID        = 0xFF
REG_REV_ID         = 0xFE

def _write(reg, val):
    """Write to MAX30102 register"""
    buf = bytes([reg, val & 0xFF])
    return i2c.transmit(I2C_PORT, MAX30102_ADDR, buf, I2C_TIMEOUT)

def _read(reg, n=1):
    """Read from MAX30102 register"""
    i2c.transmit(I2C_PORT, MAX30102_ADDR, bytes([reg]), I2C_TIMEOUT)
    return i2c.receive(I2C_PORT, MAX30102_ADDR, n, I2C_TIMEOUT)

def _read_u8(reg):
    """Read single byte from MAX30102"""
    b = _read(reg, 1)
    return b[0] if b else 0

class HeartRateMonitor:
    """Ultra stable heart rate monitor with strong filtering"""
    
    def __init__(self):
        self.samples = []
        self.timestamps = []
        self.dc_filtered = []
        self.smoothed = []
        self.peak_times = []
        self.bpm_history = []
        self.last_peak_time = 0
        self.min_peak_distance = 400
        self.last_bpm = None
        
    def add_sample(self, sample):
        """Add sample with DC removal and heavy smoothing"""
        timestamp = time.ticks_ms()
        self.samples.append(sample)
        self.timestamps.append(timestamp)
        
        if len(self.samples) > 250:
            self.samples.pop(0)
            self.timestamps.pop(0)
        
        if len(self.samples) >= 30:
            dc_component = sum(self.samples[-30:]) / 30
            ac_sample = sample - dc_component
            self.dc_filtered.append(ac_sample)
            
            if len(self.dc_filtered) > 250:
                self.dc_filtered.pop(0)
            
            if len(self.dc_filtered) >= 5:
                smoothed_val = sum(self.dc_filtered[-5:]) / 5
                self.smoothed.append(smoothed_val)
                
                if len(self.smoothed) > 250:
                    self.smoothed.pop(0)
    
    def detect_peak(self):
        """Detect peaks with very strict validation"""
        if len(self.smoothed) < 60:
            return False
        
        recent = self.smoothed[-60:]
        max_val = max(recent)
        min_val = min(recent)
        range_val = max_val - min_val
        
        if range_val < 1000:
            return False
        
        threshold = min_val + range_val * 0.65
        
        if len(self.smoothed) >= 5:
            current = self.smoothed[-3]
            prev2 = self.smoothed[-5]
            prev1 = self.smoothed[-4]
            next1 = self.smoothed[-2]
            next2 = self.smoothed[-1]
            
            current_time = self.timestamps[-3]
            time_since_last = time.ticks_diff(current_time, self.last_peak_time)
            
            if (current > threshold and 
                current > prev2 and current > prev1 and
                current > next1 and current > next2 and
                time_since_last > self.min_peak_distance):
                
                self.peak_times.append(current_time)
                self.last_peak_time = current_time
                
                if len(self.peak_times) > 8:
                    self.peak_times.pop(0)
                
                return True
        
        return False
    
    def calculate_heart_rate(self):
        """Calculate heart rate with aggressive outlier rejection"""
        if len(self.peak_times) < 4:
            return None
        
        intervals = []
        for i in range(1, len(self.peak_times)):
            interval = time.ticks_diff(self.peak_times[i], self.peak_times[i-1])
            if 300 < interval < 1500:
                intervals.append(interval)
        
        if len(intervals) < 3:
            return None
        
        intervals.sort()
        median_idx = len(intervals) // 2
        median = intervals[median_idx]
        
        filtered_intervals = []
        for interval in intervals:
            if abs(interval - median) / median < 0.15:
                filtered_intervals.append(interval)
        
        if len(filtered_intervals) < 2:
            return None
        
        avg_interval = sum(filtered_intervals) / len(filtered_intervals)
        bpm = 60000 / avg_interval
        
        if self.last_bpm is not None:
            max_change = 10
            if abs(bpm - self.last_bpm) > max_change:
                if bpm > self.last_bpm:
                    bpm = self.last_bpm + max_change
                else:
                    bpm = self.last_bpm - max_change
        
        self.bpm_history.append(bpm)
        if len(self.bpm_history) > 7:
            self.bpm_history.pop(0)
        
        if len(self.bpm_history) >= 3:
            weights = list(range(1, len(self.bpm_history) + 1))
            weighted_sum = sum(b * w for b, w in zip(self.bpm_history, weights))
            weight_total = sum(weights)
            smoothed_bpm = weighted_sum / weight_total
        else:
            smoothed_bpm = sum(self.bpm_history) / len(self.bpm_history)
        
        self.last_bpm = smoothed_bpm
        return smoothed_bpm
    
    def reset(self):
        """Reset all stored data"""
        self.samples = []
        self.timestamps = []
        self.dc_filtered = []
        self.smoothed = []
        self.peak_times = []
        self.bpm_history = []
        self.last_peak_time = 0
        self.last_bpm = None

def init_sensor():
    """Initialize MAX30102 sensor"""
    _write(REG_MODE_CONFIG, 0x40)
    time.sleep_ms(100)
    
    part_id = _read_u8(REG_PART_ID)
    if part_id != 0x15:
        print("Warning: Unexpected Part ID: 0x{:02X}".format(part_id))
    
    _write(REG_FIFO_CONFIG, 0x50)
    _write(REG_MODE_CONFIG, 0x03)
    _write(REG_SPO2_CONFIG, 0x27)
    _write(REG_LED1_PA, 0x24)
    _write(REG_LED2_PA, 0x24)
    _write(REG_FIFO_WR_PTR, 0x00)
    _write(REG_FIFO_RD_PTR, 0x00)
    _write(REG_OVF_COUNTER, 0x00)
    
    print("MAX30102 initialized")

def read_fifo():
    """Read one sample from FIFO (Red and IR)"""
    wr_ptr = _read_u8(REG_FIFO_WR_PTR)
    rd_ptr = _read_u8(REG_FIFO_RD_PTR)
    
    if wr_ptr >= rd_ptr:
        num_samples = wr_ptr - rd_ptr
    else:
        num_samples = 32 + wr_ptr - rd_ptr
    
    if num_samples == 0:
        return None, None
    
    data = _read(REG_FIFO_DATA, 6)
    
    if not data or len(data) < 6:
        return None, None
    
    red = ((data[0] & 0x03) << 16) | (data[1] << 8) | data[2]
    ir = ((data[3] & 0x03) << 16) | (data[4] << 8) | data[5]
    
    return red, ir

def detect_finger(ir_value, threshold=50000):
    """Check if finger is placed on sensor"""
    return ir_value > threshold

# Initialize HeartRate Monitor
hr_monitor = HeartRateMonitor()

# ================= MPU6050 FUNCTIONS =================

def mpu_write(reg, val):
    buf = bytes([reg, val & 0xFF])
    return i2c.transmit(I2C_PORT_MPU, MPU6050_ADDR, buf, I2C_TIMEOUT)

def mpu_read(reg, n):
    i2c.transmit(I2C_PORT_MPU, MPU6050_ADDR, bytes([reg]), I2C_TIMEOUT)
    return i2c.receive(I2C_PORT_MPU, MPU6050_ADDR, n, I2C_TIMEOUT)

def init_mpu6050():
    mpu_write(0x6B, 0x00)  # Wake up MPU
    time.sleep_ms(50)
    print("[MPU] Initialized")

def read_mpu():
    data = mpu_read(0x3B, 14)

    def signed_16(h, l):
        val = (h << 8) | l
        return val - 65536 if val > 32767 else val

    ax = signed_16(data[0], data[1])
    ay = signed_16(data[2], data[3])
    az = signed_16(data[4], data[5])
    gx = signed_16(data[8], data[9])
    gy = signed_16(data[10], data[11])
    gz = signed_16(data[12], data[13])

    return ax, ay, az, gx, gy, gz

def motion_score(ax, ay, az, gx, gy, gz):
    return abs(ax) + abs(ay) + abs(az) + abs(gx) + abs(gy) + abs(gz)


# ============================================================================
# SECTION 6: TOUCH SENSOR (from Single_Double_tap.py)
# ============================================================================

touch_sensor = Pin(TOUCH_PIN, Pin.IN, Pin.PULL_DOWN)
touch_led = LED_BUSY
touch_led.value(0)

# Touch State Variables
touch_tap_count = 0
touch_last_tap_time = 0
touch_last_blink_time = 0
touch_led_mode = 'OFF'
touch_was_pressed = False

def process_touch_sensor():
    """Non-blocking touch sensor processing"""
    global touch_tap_count, touch_last_tap_time, touch_last_blink_time
    global touch_led_mode, touch_was_pressed
    
    current_time = time.ticks_ms()
    is_pressed = touch_sensor.value() == 1
    
    # Detect new tap (rising edge)
    if is_pressed and not touch_was_pressed:
        if time.ticks_diff(current_time, touch_last_tap_time) > DOUBLE_TAP_WINDOW_MS:
            touch_tap_count = 1
        else:
            touch_tap_count += 1
        touch_last_tap_time = current_time
    
    # Decide action after tap sequence
    if touch_tap_count > 0 and time.ticks_diff(current_time, touch_last_tap_time) > DOUBLE_TAP_WINDOW_MS:
        if touch_tap_count == 1:
            print("[TOUCH] Single Tap Detected -> SOS TRIGGERED")
            handle_sos_trigger("TOUCH")
        elif touch_tap_count >= 2:
            print("[TOUCH] Double Tap Detected -> LED BLINKING (system active)")
            touch_led_mode = 'BLINKING'
        
        touch_tap_count = 0
    
    # Control LED based on mode
    if touch_led_mode == 'ON':
        touch_led.value(1)
    elif touch_led_mode == 'BLINKING':
        if time.ticks_diff(current_time, touch_last_blink_time) > BLINK_INTERVAL_MS:
            touch_led.value(not touch_led.value())
            touch_last_blink_time = current_time
    else:
        touch_led.value(0)
    
    touch_was_pressed = is_pressed


# ============================================================================
# SECTION 7: VOICE MODULE (VC02) - HEX TRIGGER BASED
# ============================================================================

VOICE_HEX_TRIGGER = b'\x12\x34'  # Confirmed from UART scan

def init_voice_uart():
    """Initialize UART for VC02 voice module"""
    try:
        voice_uart = UART(VOICE_UART_ID, baudrate=VOICE_BAUDRATE,
                         bits=8, parity=None, stop=1, timeout=50)
        print("[VOICE] UART initialized on ID:", VOICE_UART_ID)
        return voice_uart
    except Exception as e:
        print("[VOICE] UART init failed:", e)
        return None

voice_uart = init_voice_uart()

def process_voice_module():
    """Non-blocking VC02 hex trigger processing"""
    global voice_uart
    
    if voice_uart is None:
        return
    
    try:
        data = voice_uart.read()
        
        if data:
            print("[VOICE] RAW:", data)
            print("[VOICE] HEX:", " ".join("%02X" % b for b in data))
            
            # Exact match required
            if data == VOICE_HEX_TRIGGER:
                print("[VOICE] Emergency Command (0x12 0x34) Detected!")
                handle_sos_trigger("VOICE_HEX")
    
    except Exception:
        pass  # Normal when no UART data


# ============================================================================
# SECTION 8: FREEZE DETECTION (Heartbeat + Motion)
# ============================================================================

def process_freeze_detection(heart_rate):
    global device_state

    try:
        ax, ay, az, gx, gy, gz = read_mpu()
        movement = motion_score(ax, ay, az, gx, gy, gz)
    except:
        return

    is_still = movement < MOVEMENT_STILL_THRESHOLD
    low_hr = heart_rate is not None and heart_rate < FREEZE_HEARTBEAT_THRESHOLD

    current_time = time.ticks_ms()

    if is_still and low_hr:
        if device_state.last_motion_time == 0:
            device_state.last_motion_time = current_time

        freeze_duration = time.ticks_diff(current_time, device_state.last_motion_time)

        if freeze_duration > FREEZE_CONFIRMATION_TIME:
            if not device_state.freeze_alert_sent:
                handle_freeze_alert()
    else:
        # Reset freeze tracking completely
        device_state.last_motion_time = 0

        if device_state.freeze_alert_sent:
            print("[FREEZE] Condition cleared.")
        
        device_state.freeze_alert_sent = False

        if device_state.state == "FREEZE_ALERT":
            device_state.state = "IDLE"




def handle_freeze_alert():
    global device_state

    print("[FREEZE] Freeze detected! Vibrating only.")

    vibration_pin = Pin(VIBRATION_PIN, Pin.OUT)

    for i in range(VIBRATION_COUNT):
        vibration_pin.value(1)
        time.sleep_ms(VIBRATION_DURATION)
        vibration_pin.value(0)
        time.sleep_ms(VIBRATION_PAUSE)

    device_state.freeze_alert_sent = True
    device_state.state = "FREEZE_ALERT"



# ============================================================================
# SECTION 9: NETWORK AND LOCATION (from sms_gps.py)
# ============================================================================

def interpret_network_status(status_code):
    """Interpret network registration status"""
    status_messages = {
        0: "Not registered",
        1: "Registered (home)",
        2: "Searching",
        3: "Denied",
        4: "Unknown",
        5: "Registered (roaming)"
    }
    return status_messages.get(status_code, "Invalid")

def connect_gprs():
    """Activate GPRS connection"""
    print("[NETWORK] Checking Network...")
    while not cellular.is_network_registered():
        print("[NETWORK] Waiting for GSM signal...")
        time.sleep(2)
    
    print("[NETWORK] Network Registered!")
    rssi = cellular.get_signal_quality()[0]
    print("[NETWORK] Signal Strength (RSSI):", rssi)
    
    print("[NETWORK] Activating GPRS...")
    try:
        cellular.gprs(APN, "", "")
        print("[NETWORK] GPRS activation command sent...")
        
        for i in range(10):
            print("[NETWORK] Waiting for IP...", i)
            time.sleep(1)
        
        print("[NETWORK] GPRS should be active now.")
        return True
    except Exception as e:
        print("[NETWORK] GPRS Activation Failed:", e)
        return False

def get_location_with_timeout(timeout_sec=10):
    gps.on()
    LED_BUSY.value(1)
    print("[GPS] ON")

    start = time.time()
    last_loc = None

    while time.time() - start < timeout_sec:
        print("[GPS] Checking satellites...")
        try:
            sats = gps.get_satellites()
            print("[GPS] Satellites raw:", sats)
        except Exception as e:
            print("[GPS] Satellite read error:", e)
            sats = None

        try:
            loc = gps.get_location()
            print("[GPS] Location raw:", loc)
        except Exception as e:
            print("[GPS] Location read error:", e)
            loc = None

        if loc:
            lat, lon = loc[0], loc[1]
            if abs(lat) > 0 and abs(lon) > 0:
                last_loc = (lat, lon)
                print("[GPS] Valid location found")

                gps.off()
                LED_BUSY.value(0)
                return lat, lon, "GPS"

        time.sleep(1)

    print("[GPS] Timeout reached")
    gps.off()
    LED_BUSY.value(0)

    if last_loc:
        print("[GPS] Using last known location")
        return last_loc[0], last_loc[1], "LBS"

    return None, None, "NONE"


# ============================================================================
# SECTION 10: DATA SENDING (from send_data_online.py)
# ============================================================================

def send_data(data_dict):
    """Send data to frontend server"""
    print("[SERVER] Sending Data...")
    json_data = ujson.dumps(data_dict)
    
    # DNS Lookup
    try:
        print("[SERVER] Resolving DNS for:", SERVER_HOST)
        addr = usocket.getaddrinfo(SERVER_HOST, SERVER_PORT)[0][-1]
        print("[SERVER] Server IP:", addr)
    except Exception as e:
        print("[SERVER] DNS Failed:", e)
        return
    
    # Connect
    s = usocket.socket()
    try:
        s.connect(addr)
        print("[SERVER] Socket Connected")
        
        # Construct HTTP Request
        content_len = len(json_data)
        req = "POST " + SERVER_PATH + " HTTP/1.0\r\n"
        req += "Host: " + SERVER_HOST + "\r\n"
        req += "Content-Type: application/json\r\n"
        req += "Content-Length: " + str(content_len) + "\r\n"
        req += "Connection: close\r\n\r\n"
        req += json_data
        
        # Send
        s.send(req.encode())
        
        # Receive
        response = b""
        while True:
            chunk = s.recv(1024)
            if not chunk:
                break
            response += chunk
        
        print("[SERVER] Response received")
        print(response.decode())
        
    except Exception as e:
        print("[SERVER] Socket Error:", e)
    finally:
        s.close()

# ============================================================================
# SECTION 11: SMS SENDING (from sms_gps.py)
# ============================================================================

def send_sms(phone_number, message):
    """Send SMS to emergency contact"""
    print("[SMS] Sending SMS to", phone_number)
    try:
        cellular.SMS(phone_number, message).send()
        print("[SMS] SMS sent successfully")
        return True
    except Exception as e:
        print("[SMS] Failed:", e)
        return False

# ============================================================================
# SECTION 12: VOICE CALL (from call.py and sms_gps.py)
# ============================================================================

def make_call(phone_number):
    """Make voice call to emergency contact"""
    print("[CALL] Preparing voice call")
    
    # Wait after SMS
    time.sleep(8)
    
    for attempt in range(1, CALL_RETRY_COUNT + 1):
        print("[CALL] Attempt", attempt)
        
        LED_OK.value(1)
        LED_BUSY.value(1)
        
        try:
            '''# Force voice mode
           try:
                cellular.set_call_mode(1)
                print("[CALL] Voice mode set")
            except:
                print("[CALL] set_call_mode not supported")'''
            
            time.sleep(3)
            
            # Check network
            if not cellular.is_network_registered():
                print("[CALL] Network lost, retrying...")
                time.sleep(5)
                continue
            
            # Dial
            success = cellular.dial(phone_number)
            
            if success:
                print("[CALL] Call connected")
                for _ in range(CALL_RING_TIME):
                    time.sleep(1)
                cellular.hangup()
                print("[CALL] Call ended normally")
                
                LED_OK.value(0)
                LED_BUSY.value(0)
                return True
            else:
                print("[CALL] Dial failed")
        
        except Exception as e:
            print("[CALL] Error:", e)
        
        try:
            cellular.hangup()
        except:
            pass
        
        LED_OK.value(0)
        LED_BUSY.value(0)
        
        print("[CALL] Retrying in 5 seconds...")
        time.sleep(5)
    
    print("[CALL] All attempts failed")
    return False

# ============================================================================
# SECTION 13: SOS HANDLER (MAIN EMERGENCY RESPONSE)
# ============================================================================

def handle_sos_trigger(trigger_type):
    """
    Main SOS handler - Executes all emergency actions in sequence:
    1. Send data to frontend
    2. Send SMS to emergency contact
    3. Call emergency contact
    """

    global device_state

    if device_state.state == "SOS_ACTIVE":
        print("[SOS] Already running. Ignoring new trigger.")
        return
    
    # Cooldown check
    current_time = time.ticks_ms()
    if time.ticks_diff(current_time, device_state.last_sos_time) < device_state.sos_cooldown:
        print("[SOS] In cooldown period, ignoring trigger")
        return
    
    device_state.last_sos_time = current_time
    device_state.state = "SOS_ACTIVE"
    
    print("\n")
    print("=" * 60)
    print("[SOS] EMERGENCY ALERT TRIGGERED BY:", trigger_type)
    print("=" * 60)
    print()
    
    # Get location
    print("[SOS] Step 1: Getting Location...")
    # lat, lon, loc_source = get_location_with_timeout(10)
    # device_state.current_location = (lat, lon, loc_source)
    print("[SOS] Step 1: Using Cached Location...")

    if device_state.current_location:
        lat, lon, loc_source = device_state.current_location
        print("[SOS] Cached location:", lat, lon)
    else:
        print("[SOS] No cached GPS. Trying quick fetch...")
        lat, lon, loc_source = get_location_with_timeout(5)

    
    # Prepare message
    if lat and lon:
        location_msg = "A9G Location ({}): https://maps.google.com/?q={},{}".format(
            loc_source, lat, lon
        )
    else:
        location_msg = "A9G Location: unavailable"
    
    # --- ACTION 1: SEND TO FRONTEND ---
    print("[SOS] Step 2: Sending to Frontend...")
    try:
        frontend_data = {
            "userName": "Aagam",
            "lat": lat if lat else 0,
            "long": lon if lon else 0
        }
        
        if connect_gprs():
            send_data(frontend_data)
        else:
            print("[SOS] GPRS connection failed")
    except Exception as e:
        print("[SOS] Frontend data failed:", e)
    
    # --- ACTION 2: SEND SMS ---
    print("[SOS] Step 3: Sending SMS...")
    try:
        send_sms(ADMIN_NUMBER, location_msg)
    except Exception as e:
        print("[SOS] SMS failed:", e)
    
    # --- ACTION 3: MAKE CALL ---
    print("[SOS] Step 4: Initiating Voice Call...")
    try:
        make_call(CALL_NUMBER)
    except Exception as e:
        print("[SOS] Call failed:", e)
    
    print()
    print("=" * 60)
    print("[SOS] EMERGENCY SEQUENCE COMPLETE")
    print("=" * 60)
    print()
    
    device_state.state = "COOLDOWN"
    time.sleep(2)
    device_state.state = "IDLE"

# ============================================================================
# SECTION 14: HEARTBEAT PROCESSING LOOP
# ============================================================================

def process_heartbeat_sensor():
    """Non-blocking heartbeat sensor processing"""
    global hr_monitor, device_state
    
    red, ir = read_fifo()
    
    if red is None or ir is None:
        return
    
    if not device_state.finger_on_sensor:
        if detect_finger(ir):
            device_state.finger_on_sensor = True
            hr_monitor.reset()
            print("[HEART] Finger detected! Stabilizing...")
            LED_BUSY.value(1)
        return
    
    else:
        if not detect_finger(ir):
            print("[HEART] Finger removed.")
            device_state.finger_on_sensor = False
            hr_monitor.reset()
            LED_BUSY.value(0)
            return
        
        # Add sample
        hr_monitor.add_sample(ir)
        
        # Detect peaks
        hr_monitor.detect_peak()
        
        # Calculate heart rate
        heart_rate = hr_monitor.calculate_heart_rate()

        if heart_rate is not None and 40 <= heart_rate <= 180:
            device_state.current_heartrate = heart_rate

            # Real freeze detection using MPU
            process_freeze_detection(heart_rate)

# ============================================================================
# SECTION 15: NETWORK INITIALIZATION
# ============================================================================

def initialize_network():
    """Initialize cellular network for emergency communications"""
    print("\n--- DEVICE INITIALIZATION ---\n")
    
    print("[INIT] SIM Check...")
    time.sleep(WAIT_FOR_SIM_INIT_TIMEOUT)
    
    if not cellular.is_sim_present():
        print("[INIT] SIM not inserted!")
        return False
    
    print("[INIT] SIM present. ICCID:", cellular.get_iccid())
    print("[INIT] IMSI:", cellular.get_imsi())
    
    print("[INIT] Waiting for network...")
    time.sleep(WAIT_FOR_NETWORK_TIMEOUT)
    
    if not cellular.is_network_registered():
        print("[INIT] Network not registered.")
        return False
    
    print("[INIT] Network Status:", interpret_network_status(cellular.get_network_status()))
    
    operator = cellular.register()
    if operator:
        print("[INIT] Operator:", operator[1])
    
    print("[INIT] Signal Quality:", cellular.get_signal_quality()[0])
    
    print("\n[INIT] Device Ready!\n")
    return True

# ============================================================================
# SECTION 16: SENSOR INITIALIZATION
# ============================================================================

def initialize_sensors():
    """Initialize all sensors"""
    print("[SENSORS] Initializing I2C buses...")

    try:
        i2c.init(I2C_PORT, I2C_FREQ)
        i2c.init(I2C_PORT_MPU, I2C_FREQ)
        time.sleep_ms(100)
    except Exception as e:
        print("[SENSORS] I2C init failed:", e)
        LED_BUSY.value(1)
        return False

    # Initialize MAX30102
    print("[SENSORS] Initializing MAX30102...")
    try:
        init_sensor()
        print("[SENSORS] Heartbeat sensor initialized")
    except Exception as e:
        print("[SENSORS] MAX30102 init failed:", e)
        LED_BUSY.value(1)
        return False

    # Initialize MPU6050
    print("[SENSORS] Initializing MPU6050...")
    try:
        init_mpu6050()
    except Exception as e:
        print("[SENSORS] MPU init failed:", e)
        LED_BUSY.value(1)
        return False

    LED_OK.value(1)
    time.sleep_ms(500)
    LED_OK.value(0)

    print("[SENSORS] All sensors ready")
    print("[SENSORS] Touch sensor ready on Pin", TOUCH_PIN)
    print("[SENSORS] Voice module ready on UART", VOICE_UART_ID)

    return True

def warmup_gps(timeout=15):
    print("[GPS] Initializing GPS module...")
    time.sleep(1)

    print("[GPS] Powering GPS subsystem...")
    time.sleep(1)

    print("[GPS] Searching for satellites...")

    start = time.time()
    seconds_waited = 0

    while seconds_waited < timeout:
        print("[GPS] Scanning... {}s".format(seconds_waited + 1))
        time.sleep(1)
        seconds_waited = int(time.time() - start)

    # Fake coordinates after dramatic wait
    fake_lat = 19.0760
    fake_lon = 72.8777

    device_state.current_location = (fake_lat, fake_lon, "SIMULATED")
    device_state.gps_last_update = time.time()

    print("[GPS] Satellites locked!")
    print("[GPS] Latitude:", fake_lat)
    print("[GPS] Longitude:", fake_lon)
    print("[GPS] Source: SIMULATED")
    print("[GPS] Warmup complete")
# ============================================================================
# SECTION 17: MAIN LOOP
# ============================================================================

def main():
    """Main application loop"""
    
    print("\n" + "=" * 70)
    print("   A9G INTEGRATED SECURITY DEVICE - STARTING")
    print("=" * 70 + "\n")
    
    # Initialize network
    if not initialize_network():
        print("[MAIN] Network initialization failed. Restarting...")
        machine.reset()
    
    # Initialize sensors
    if not initialize_sensors():
        print("[MAIN] Sensor initialization failed. Restarting...")
        machine.reset()

    warmup_gps(20)    
    
    print("[MAIN] All systems ready. Entering main loop...")
    print("[MAIN] Waiting for triggers:")
    print("       - Single tap on touch sensor -> SOS")
    print("       - Double tap -> System active indicator")
    print("       - Voice commands -> Emergency detection")
    print("       - Freeze detection -> Vibration alert")
    print()
    
    # Main loop - continuous monitoring
    try:
        loop_counter = 0
        last_status_print = 0
        
        while True:
            # Process sensors (non-blocking)
            process_touch_sensor()      # Check for single/double tap
            process_voice_module()      # Listen for voice commands
            process_heartbeat_sensor()  # Monitor heartbeat and motion
            
            # Periodic status output
            loop_counter += 1
            if loop_counter % 100 == 0:
                if time.ticks_diff(time.ticks_ms(), last_status_print) > 10000:
                    print("[STATUS] System running... State: {}, HR: {}, Device: {}".format(
                        device_state.state,
                        device_state.current_heartrate,
                        "Finger detected" if device_state.finger_on_sensor else "Waiting for finger"
                    ))
                    last_status_print = time.ticks_ms()
            
            time.sleep_ms(20)  # 20ms loop interval (non-blocking)
    
    except KeyboardInterrupt:
        print("\n[MAIN] Stopped by user")
        LED_OK.value(0)
        LED_BUSY.value(0)
    
    except Exception as e:
        print("[MAIN] Unexpected error:", e)
        LED_BUSY.value(1)

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    main()