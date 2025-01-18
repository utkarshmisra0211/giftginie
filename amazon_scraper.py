import sys
import json
import requests
from bs4 import BeautifulSoup
from time import sleep

def get_amazon_product_info(product_name):
    """
    Scrapes Amazon product information without filters - we'll handle filtering in the code
    """
    search_url = f"https://www.amazon.in/s?k={product_name.replace(' ', '+')}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive"
    }

    try:
        response = requests.get(search_url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        products = soup.find_all('div', {'data-component-type': 's-search-result'})

        for product in products:
            try:
                # Get product link
                link_element = product.find('a', {'class': 'a-link-normal s-no-outline'})
                product_link = f"https://www.amazon.in{link_element['href']}" if link_element else None

                # Get title
                title_element = product.find('span', {'class': 'a-size-medium'})
                if not title_element:
                    title_element = product.find('span', {'class': 'a-size-base-plus'})
                title = title_element.text.strip() if title_element else None

                # Get price
                price_element = product.find('span', {'class': 'a-price-whole'})
                price_text = price_element.text.strip() if price_element else "0"
                price = int(''.join(filter(str.isdigit, price_text)))

                # Get rating
                rating_element = product.find('span', {'class': 'a-icon-alt'})
                rating_text = rating_element.text.strip() if rating_element else "0"
                try:
                    rating = float(rating_text.split()[0])
                except (ValueError, IndexError):
                    rating = 0.0

                # Get image URL
                img_element = product.find('img', {'class': 's-image'})
                image_url = img_element['src'] if img_element else None

                # Return the product data
                return {
                    'title': title,
                    'price': f"₹{price:,}",
                    'raw_price': price,  # Added for filtering
                    'rating': f"{rating} out of 5 stars",
                    'raw_rating': rating,  # Added for filtering
                    'image_url': image_url,
                    'product_link': product_link
                }

            except Exception as e:
                print(f"Error processing product: {str(e)}", file=sys.stderr)
                continue

        return None

    except requests.RequestException as e:
        print(f"Error making request: {str(e)}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error processing response: {str(e)}", file=sys.stderr)
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python amazon_scraper.py <product_name>", file=sys.stderr)
        sys.exit(1)

    try:
        product_name = sys.argv[1]
        result = get_amazon_product_info(product_name)
        if result:
            print(json.dumps(result))
        else:
            print("null")
            
    except Exception as e:
        print(f"Unexpected error: {str(e)}", file=sys.stderr)
        sys.exit(1)