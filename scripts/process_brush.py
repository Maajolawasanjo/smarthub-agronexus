from PIL import Image
import numpy as np

def remove_white_background(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        img = Image.open(input_path).convert("RGBA")
        data = np.array(img)
        
        # Define white threshold (e.g., pixels brighter than 240 in all channels)
        dest_r, dest_g, dest_b = 255, 255, 255
        threshold = 200
        
        # Create mask for white(ish) pixels
        red, green, blue, alpha = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
        mask = (red > threshold) & (green > threshold) & (blue > threshold)
        
        # Set alpha to 0 for matching pixels
        data[:,:,3][mask] = 0
        
        # Create new image
        new_img = Image.fromarray(data)
        new_img.save(output_path, "PNG")
        print(f"Saved transparent image to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

input_file = r"C:/Users/NUTM Library User 2/.gemini/antigravity/brain/c9784b26-cb79-4300-9eb6-4c8dc5265c6d/uploaded_image_1768566825479.png"
output_file = r"c:/Users/NUTM Library User 2/Documents/Smarthub Agronexus/smarthub-agronexus/public/brush-border.png"

remove_white_background(input_file, output_file)
