import argparse
import json
import os
import time
import re
import subprocess
from PIL import Image
import pyautogui
import pygetwindow as gw
import pytesseract
import webbrowser
import sys
import string
import unicodedata
import requests
from datetime import datetime
import pytz

# Set the Tesseract path for Windows (system installation)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# --- CROP AREA ADJUSTMENT ---
# You can adjust these values if the OCR is not reading the textbox area correctly on your screen.
CROP_TOP = 0.75  # Start of crop as % of height (was 0.87)
CROP_BOTTOM = 1.00  # End of crop as % of height (was 0.99)


def open_whatsapp_chat(phone_number):
    os.system(f'start whatsapp://send?phone=91{phone_number}')
    time.sleep(2)  # Wait 2 seconds for WhatsApp to load

def maximize_whatsapp_window():
    """Maximize and focus WhatsApp window"""
    # Try to find actual WhatsApp application windows
    window_titles = ['WhatsApp', 'WhatsApp Desktop']
    
    for title in window_titles:
        windows = [w for w in gw.getWindowsWithTitle(title) if w.visible]
        if windows:
            wa_win = windows[0]
            # print(f"Found WhatsApp window: {wa_win.title}") # Debug output removed to avoid JSON corruption
            try:
                wa_win.activate()
                wa_win.maximize()
                time.sleep(2)  # Wait for window to be ready
                return True
            except Exception as e:
                # print(f"Error activating window: {e}") # Debug output removed to avoid JSON corruption
                continue
    
    # Try to find WhatsApp Web in browser
    browser_titles = ['WhatsApp Web', 'WhatsApp - Google Chrome', 'WhatsApp - Microsoft Edge']
    for title in browser_titles:
        windows = [w for w in gw.getWindowsWithTitle(title) if w.visible]
        if windows:
            wa_win = windows[0]
            # print(f"Found WhatsApp browser window: {wa_win.title}") # Debug output removed to avoid JSON corruption
            try:
                wa_win.activate()
                wa_win.maximize()
                time.sleep(2)
                return True
            except Exception as e:
                # print(f"Error activating browser window: {e}") # Debug output removed to avoid JSON corruption
                continue
    
    # print("❌ No WhatsApp window found! Please open WhatsApp Desktop or WhatsApp Web.") # Debug output removed to avoid JSON corruption
    return False

def screenshot_whatsapp(save_path):
    windows = [w for w in gw.getWindowsWithTitle('WhatsApp') if w.visible]
    if not windows:
        return False
    wa_win = windows[0]
    wa_win.activate()
    time.sleep(0.5)
    bbox = (wa_win.left, wa_win.top, wa_win.left + wa_win.width, wa_win.top + wa_win.height)
    screenshot = pyautogui.screenshot(region=bbox)
    screenshot.save(save_path)
    return True

def ocr_textbox_area(image_path):
    img = Image.open(image_path)
    width, height = img.size
    # Extract only the bottom 20% of the window for OCR
    crop_top = int(height * 0.80)
    crop_bottom = height
    box_area = img.crop((0, crop_top, width, crop_bottom))
    # Save the cropped area for visual debugging
    try:
        box_area.save('wa_crop_debug.png')
    except Exception:
        pass
    text = pytesseract.image_to_string(box_area)
    # Log OCR output for debugging
    try:
        with open('wa_ocr_debug.txt', 'a', encoding='utf-8') as f:
            f.write(f'--- OCR Output ({time.strftime("%Y-%m-%d %H:%M:%S")}): ---\n{text}\n\n')
    except Exception:
        pass
    return text

def close_whatsapp():
    # Suppress output from taskkill by redirecting to DEVNULL
    with open(os.devnull, 'w') as devnull:
        subprocess.call('taskkill /IM WhatsApp.exe /F', shell=True, stdout=devnull, stderr=devnull)

def remove_screenshot():
    try:
        if os.path.exists('wa_temp.png'):
            os.remove('wa_temp.png')
    except Exception:
        pass

def fuzzy_match(a, b, max_distance=1):
    """Return True if a and b are similar within max_distance (Levenshtein)."""
    if a == b:
        return True
    if abs(len(a) - len(b)) > max_distance:
        return False
    # Simple Levenshtein distance
    dp = [[i + j if i * j == 0 else 0 for j in range(len(b) + 1)] for i in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            )
    return dp[-1][-1] <= max_distance

def normalize_text(text):
    # Lowercase, remove spaces, punctuation, and normalize unicode
    text = text.lower()
    text = ''.join(c for c in unicodedata.normalize('NFKD', text) if c.isalnum())
    return text

def is_textbox_present(ocr_text):
    # If the word 'message' appears anywhere in the OCR text, it's Verified
    norm_text = ocr_text.lower().translate(str.maketrans('', '', string.punctuation))
    if 'message' in norm_text:
        return True
    return False

def verify_primary_key_in_screenshot(expected_key):
    try:
        maximize_whatsapp_window()
        script_dir = os.path.dirname(os.path.abspath(__file__))
        screenshot_path = os.path.join(script_dir, 'wa_temp.png')
        if not screenshot_whatsapp(screenshot_path):
            print(json.dumps({'match': False, 'error': 'Could not take screenshot', 'expected': expected_key, 'extracted': ''}))
            close_whatsapp()
            remove_screenshot()
            return
        ocr_text = ocr_textbox_area(screenshot_path)
        # Try to find the expected key in the OCR text (robust match)
        found = False
        extracted = ''
        norm_expected = normalize_text(expected_key)
        for line in ocr_text.splitlines():
            norm_line = normalize_text(line)
            if norm_expected in norm_line:
                found = True
                extracted = line.strip()
                break
            if fuzzy_match(norm_expected, norm_line, max_distance=2):
                found = True
                extracted = line.strip()
                break
        result = {
            'match': found,
            'expected': expected_key,
            'extracted': extracted,
            'ocr_text': ocr_text
        }
        print(json.dumps(result))
        close_whatsapp()
        remove_screenshot()
    except Exception as e:
        print(json.dumps({'match': False, 'error': str(e), 'expected': expected_key, 'extracted': ''}))
        close_whatsapp()
        remove_screenshot()

def verify_message_text_in_screenshot(expected_text):
    try:
        maximize_whatsapp_window()
        script_dir = os.path.dirname(os.path.abspath(__file__))
        screenshot_path = os.path.join(script_dir, 'wa_temp.png')
        if not screenshot_whatsapp(screenshot_path):
            print(json.dumps({'match': False, 'error': 'Could not take screenshot', 'expected': expected_text, 'extracted': ''}))
            close_whatsapp()
            remove_screenshot()
            return
        ocr_text = ocr_textbox_area(screenshot_path)
        found = False
        extracted = ''
        norm_expected = normalize_text(expected_text)
        for line in ocr_text.splitlines():
            norm_line = normalize_text(line)
            if norm_expected in norm_line:
                found = True
                extracted = line.strip()
                break
            if fuzzy_match(norm_expected, norm_line, max_distance=2):
                found = True
                extracted = line.strip()
                break
        result = {
            'match': found,
            'expected': expected_text,
            'extracted': extracted,
            'ocr_text': ocr_text
        }
        print(json.dumps(result))
        close_whatsapp()
        remove_screenshot()
    except Exception as e:
        print(json.dumps({'match': False, 'error': str(e), 'expected': expected_text, 'extracted': ''}))
        close_whatsapp()
        remove_screenshot()

def screenshot_message_area_and_get_timestamp():
    """Take screenshot of first chat area and extract timestamp"""
    try:
        import requests
        from datetime import datetime
        
        # Ensure WhatsApp is maximized and focused
        maximize_whatsapp_window()
        time.sleep(1)  # Give WhatsApp time to come to foreground
        
        script_dir = os.path.dirname(os.path.abspath(__file__))
        screenshot_path = os.path.join(script_dir, 'wa_temp.png')
        
        if not screenshot_whatsapp(screenshot_path):
            print(json.dumps({'success': False, 'error': 'Could not take screenshot'}))
            close_whatsapp()
            remove_screenshot()
            return
            
        # Take screenshot of message area (upper portion of chat)
        img = Image.open(screenshot_path)
        width, height = img.size
        
        # Extract the first chat area - focus on the topmost chat entry
        # Adjust coordinates for better WhatsApp targeting
        first_chat_top = int(height * 0.20)   # Start a bit lower after header
        first_chat_bottom = int(height * 0.40) # Capture more of the first chat
        first_chat_right = int(width * 0.60)   # Only left side where chat list is
        first_chat_area = img.crop((0, first_chat_top, first_chat_right, first_chat_bottom))
        
        # Save the cropped first chat area for processing (will be cleaned up)
        message_screenshot_path = os.path.join(script_dir, 'wa_first_chat_temp.png')
        first_chat_area.save(message_screenshot_path)
        
        # Extract text from first chat area using OCR
        ocr_text = pytesseract.image_to_string(first_chat_area)
        
        # Log OCR output for debugging (optional - remove for production)
        try:
            debug_file = os.path.join(script_dir, 'wa_ocr_temp.txt')
            with open(debug_file, 'w', encoding='utf-8') as f:
                f.write(f'--- First Chat OCR Output ({time.strftime("%Y-%m-%d %H:%M:%S")}): ---\n{ocr_text}\n\n')
        except Exception:
            pass
        
        # Extract timestamp from the first chat only
        # Look for time patterns like "10:30 AM", "22:45", "2:15 PM" etc.
        import re
        time_patterns = [
            r'\b(\d{1,2}):(\d{2})\s*(AM|PM)\b',  # 12-hour format with AM/PM
            r'\b(\d{1,2}):(\d{2})\b',           # 24-hour format or 12-hour without AM/PM
        ]
        
        extracted_times = []
        for pattern in time_patterns:
            matches = re.findall(pattern, ocr_text, re.IGNORECASE)
            for match in matches:
                if len(match) == 3:  # 12-hour format with AM/PM
                    hour, minute, ampm = match
                    extracted_times.append(f"{hour}:{minute} {ampm.upper()}")
                else:  # 24-hour format
                    hour, minute = match
                    extracted_times.append(f"{hour}:{minute}")
        
        # Get the first timestamp found (should be from the topmost chat)
        first_chat_timestamp = extracted_times[0] if extracted_times else None
        first_chat_time_24h = None
        
        if first_chat_timestamp:
            try:
                # Convert to 24-hour format for comparison
                if 'AM' in first_chat_timestamp.upper() or 'PM' in first_chat_timestamp.upper():
                    time_obj = datetime.strptime(first_chat_timestamp, '%I:%M %p')
                    first_chat_time_24h = time_obj.strftime('%H:%M')
                else:
                    # Already in 24-hour format
                    first_chat_time_24h = first_chat_timestamp
            except:
                first_chat_time_24h = first_chat_timestamp
        
        # Get current internet time for comparison
        try:
            response = requests.get('http://worldtimeapi.org/api/timezone/Etc/UTC', timeout=5)
            if response.status_code == 200:
                world_time_data = response.json()
                utc_time = datetime.fromisoformat(world_time_data['datetime'].replace('Z', '+00:00'))
                # Convert to local time (assuming Indian timezone +5:30)
                import pytz
                local_tz = pytz.timezone('Asia/Kolkata')
                local_time = utc_time.astimezone(local_tz)
                current_time_str = local_time.strftime('%H:%M')
            else:
                # Fallback to system time
                current_time_str = datetime.now().strftime('%H:%M')
        except Exception:
            # Fallback to system time
            current_time_str = datetime.now().strftime('%H:%M')
        
        # Compare timestamps with a small tolerance window
        time_matches = False
        extracted_time_str = "No timestamp found"
        
        if first_chat_timestamp and first_chat_time_24h:
            try:
                # Use the 24-hour format for comparison
                extracted_time_str = first_chat_time_24h
                
                # Parse both times to get minutes for comparison
                first_hour, first_minute = map(int, first_chat_time_24h.split(':'))
                current_hour, current_minute = map(int, current_time_str.split(':'))
                
                # Convert to total minutes for easier comparison
                first_total_minutes = first_hour * 60 + first_minute
                current_total_minutes = current_hour * 60 + current_minute
                
                # Allow for 0-1 minute difference for production (strict matching)
                time_difference = abs(current_total_minutes - first_total_minutes)
                time_matches = time_difference <= 1  # Allow up to 1 minute difference for production
                
            except Exception as parse_error:
                extracted_time_str = first_chat_timestamp
                # Fallback to exact string comparison
                time_matches = (first_chat_time_24h == current_time_str)
        
        result = {
            'success': True,
            'screenshot_saved': message_screenshot_path,
            'extracted_times': extracted_times,
            'first_chat_timestamp': first_chat_timestamp,
            'first_chat_time_24h': first_chat_time_24h,
            'current_time': current_time_str,
            'time_difference_minutes': time_difference if 'time_difference' in locals() else 0,
            'time_matches': time_matches,
            'ocr_text': ocr_text[:200]  # Reduced OCR text for production
        }
        
        print(json.dumps(result))
        
        # Clean up temporary files for production
        cleanup_temp_files()
        
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
        # Clean up even on error
        cleanup_temp_files()

def cleanup_temp_files():
    """Clean up temporary screenshot and debug files"""
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        temp_files = [
            'wa_first_chat_temp.png',
            'wa_temp.png', 
            'wa_ocr_temp.txt'
        ]
        
        for temp_file in temp_files:
            file_path = os.path.join(script_dir, temp_file)
            if os.path.exists(file_path):
                os.remove(file_path)
                
    except Exception as e:
        # Silently ignore cleanup errors
        pass

def main():
    try:
        parser = argparse.ArgumentParser(description='WhatsApp Chat Verifier')
        parser.add_argument('--number', help='Phone number to verify')
        parser.add_argument('--screenshot-timestamp', action='store_true', help='Take screenshot and analyze timestamp')
        args = parser.parse_args()
        
        if args.screenshot_timestamp:
            # Call the screenshot timestamp function
            screenshot_message_area_and_get_timestamp()
            return
        
        if not args.number:
            print(json.dumps({'error': 'Phone number is required when not using --screenshot-timestamp'}))
            exit(1)
            
        phone = args.number.strip()
        if not re.fullmatch(r'\d{7,15}', phone):
            print(json.dumps({'error': 'Invalid phone number'}))
            exit(1)
        open_whatsapp_chat(phone)
        maximize_whatsapp_window()
        script_dir = os.path.dirname(os.path.abspath(__file__))
        screenshot_path = os.path.join(script_dir, 'wa_temp.png')
        if not screenshot_whatsapp(screenshot_path):
            result = {
                'number': phone,
                'status': 'Not Verified',
                'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                'ocr_text': ''
            }
            print(json.dumps(result))
            close_whatsapp()
            remove_screenshot()
            exit(0)
        ocr_text = ocr_textbox_area(screenshot_path)
        status = 'Verified' if is_textbox_present(ocr_text) else 'Not Verified'
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        result = {
            'number': phone,
            'status': status,
            'timestamp': timestamp,
            'ocr_text': ocr_text
        }
        print(json.dumps(result))
        close_whatsapp()
        remove_screenshot()
        exit(0)
    except Exception as e:
        # Print only JSON error to stdout, nothing else
        print(json.dumps({'error': str(e)}))
        sys.exit(1)

# Add CLI entry point
if __name__ == '__main__':
    import sys
    if '--verify-key' in sys.argv:
        idx = sys.argv.index('--verify-key')
        if idx + 1 < len(sys.argv):
            expected_key = sys.argv[idx + 1]
            verify_primary_key_in_screenshot(expected_key)
            sys.exit(0)
        else:
            print(json.dumps({'match': False, 'error': 'No key provided', 'expected': '', 'extracted': ''}))
            sys.exit(1)
    elif '--verify-message-text' in sys.argv:
        idx = sys.argv.index('--verify-message-text')
        if idx + 1 < len(sys.argv):
            expected_text = sys.argv[idx + 1]
            verify_message_text_in_screenshot(expected_text)
            sys.exit(0)
        else:
            print(json.dumps({'match': False, 'error': 'No message text provided', 'expected': '', 'extracted': ''}))
            sys.exit(1)
    elif '--screenshot-timestamp' in sys.argv:
        screenshot_message_area_and_get_timestamp()
        sys.exit(0)
    else:
        main()