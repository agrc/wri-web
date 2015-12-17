# UpdateData.py

## Installation
1. Install dependencies by running `pip install -r Requirements.txt -t .`
1. Create your own `secrets.py` based on `secrets.py.sample`.
1. Create a `database_connections` folder as a sibling to `main.py` and add `SGID10.sde` & `UDNR.sde`.
1. Schedule to run nightly using windows scheduler
    1. Action: "Start a program"
    1. Program/script: <Path to python.exe>
    1. Add arguments: <path to `main.py`>

Note: This script must be run from the folder that contains `main.py`.
