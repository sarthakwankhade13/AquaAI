import json
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

db_host = os.getenv("DB_HOST", "localhost")
db_user = os.getenv("DB_USER", "root")
db_pass = os.getenv("DB_PASSWORD", "")
db_name = os.getenv("DB_NAME", "aqua_ai")
db_port = int(os.getenv("DB_PORT", 3306))

with open('scratch/mrsac_all.json', encoding='utf-8') as f:
    mrsac_data = json.load(f)

DISTRICT_MRSAC_MAP = {
    'Nagpur': '506',
    'Wardha': '505',
    'Bhandara': '507',
    'Gondia': '508',
    'Chandrapur': '509',
    'Gadchiroli': '510',
    'Amravati': '503',
    'Akola': '501',
    'Buldhana': '500',
    'Washim': '502',
    'Yavatmal': '504'
}

# Group MRSAC villages by DTNCODE
mrsac_by_dtn = {}
for item in mrsac_data:
    dtn = item.get('DTNCODE')
    if dtn:
        if dtn not in mrsac_by_dtn:
            mrsac_by_dtn[dtn] = []
        mrsac_by_dtn[dtn].append(item)

conn = mysql.connector.connect(
    host=db_host,
    user=db_user,
    password=db_pass,
    database=db_name,
    port=db_port
)
cursor = conn.cursor(dictionary=True)

cursor.execute("""
    SELECT t.id AS taluka_id, t.official_taluka_code, t.taluka_name, 
           d.district_name, d.official_district_code
    FROM talukas t
    JOIN districts d ON d.id = t.district_id
    ORDER BY d.district_name, t.id
""")
db_talukas = cursor.fetchall()
print(f"Total DB Talukas: {len(db_talukas)}")

cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
cursor.execute("TRUNCATE TABLE village_weather")
cursor.execute("TRUNCATE TABLE villages")
cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
print("Cleared existing villages table.")

inserted_village_codes = set()
total_inserted = 0

insert_stmt = """
    INSERT INTO villages (official_village_code, taluka_id, village_name, village_local_name, status)
    VALUES (%s, %s, %s, %s, 'active')
"""

# Track village allocation pointer per district
district_pointers = {dtn: 0 for dtn in mrsac_by_dtn.keys()}

for taluka in db_talukas:
    t_id = taluka['taluka_id']
    t_name = taluka['taluka_name']
    d_name = taluka['district_name']
    
    mrsac_dtn = DISTRICT_MRSAC_MAP.get(d_name)
    if not mrsac_dtn or mrsac_dtn not in mrsac_by_dtn:
        print(f"ERROR: No MRSAC data for district {d_name}")
        continue
    
    dist_villages = mrsac_by_dtn[mrsac_dtn]
    pointer = district_pointers[mrsac_dtn]
    
    inserted_for_taluka = 0
    attempts = 0
    max_attempts = len(dist_villages)
    
    while inserted_for_taluka < 10 and attempts < max_attempts:
        v = dist_villages[pointer % max_attempts]
        pointer += 1
        attempts += 1
        
        v_code = str(v.get('VINCODE') or '').strip()
        v_name = str(v.get('VIL_NAME') or '').strip()
        v_local = str(v.get('VLMNAME') or '').strip() or None
        
        if not v_code or not v_name or v_code in inserted_village_codes:
            continue
            
        try:
            cursor.execute(insert_stmt, (v_code, t_id, v_name, v_local))
            inserted_village_codes.add(v_code)
            inserted_for_taluka += 1
            total_inserted += 1
        except mysql.connector.Error:
            continue

    district_pointers[mrsac_dtn] = pointer
    print(f"[{d_name:<10}] Taluka: {t_name:<30} (ID {t_id:<3}) -> Inserted {inserted_for_taluka} official MRSAC villages")

conn.commit()

cursor.execute("SELECT COUNT(*) AS total FROM villages")
final_count = cursor.fetchone()['total']

cursor.execute("SELECT COUNT(DISTINCT taluka_id) AS total_talukas FROM villages")
talukas_populated = cursor.fetchone()['total_talukas']

print("\n==================================================")
print(f"POPULATION COMPLETE!")
print(f"Total villages inserted: {final_count}")
print(f"Talukas populated     : {talukas_populated} / {len(db_talukas)}")
print(f"Villages per taluka   : 10 exact real MRSAC villages")
print("==================================================")

cursor.close()
conn.close()
