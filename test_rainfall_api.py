import requests
import pandas as pd

url = "https://nwdp.nwic.gov.in/api/action/datastore_search"

params = {
    "resource_id": "f7e3f716-7189-4288-996f-acf9ef139b44",
    "filters": '{"State":"Maharashtra","District":"Nagpur"}',
    "limit": 100
}

response = requests.get(url, params=params)

print("Status Code:", response.status_code)

data = response.json()

print(data)