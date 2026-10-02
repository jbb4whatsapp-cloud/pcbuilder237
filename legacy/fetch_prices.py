import json, os
from datetime import datetime

DATA = {
    "laptops": [
        {"model": "HP EliteBook 840 G5", "cpu": "i5-8250U", "ram_base": "8GB", "ram_slots": 2, "ram_max": "32GB", "ssd_slots": 2, "prix_mokolo": 280000, "arnaque_freq": "faible"},
        {"model": "HP EliteBook 840 G6", "cpu": "i5-8365U", "ram_base": "8GB", "ram_slots": 2, "ram_max": "64GB", "ssd_slots": 2, "prix_mokolo": 320000, "arnaque_freq": "moyenne"},
        {"model": "Lenovo ThinkPad T480", "cpu": "i5-8250U", "ram_base": "8GB", "ram_slots": 2, "ram_max": "32GB", "ssd_slots": 2, "prix_mokolo": 250000, "arnaque_freq": "faible"},
    ],
    "meta": {"last_update": datetime.now().isoformat(), "source": "Mokolo", "currency": "FCFA"}
}

os.makedirs("public/data", exist_ok=True)
os.makedirs("app/data", exist_ok=True)

with open("public/data/prices.json", "w", encoding="utf-8") as f:
    json.dump(DATA, f, indent=2, ensure_ascii=False)
with open("app/data/prices.json", "w", encoding="utf-8") as f:
    json.dump(DATA, f, indent=2, ensure_ascii=False)

print(f"✅ {len(DATA['laptops'])} laptops générés")