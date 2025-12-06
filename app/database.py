# app/database.py
import pymysql

DB_CONFIG = { #configure conforme o banco local
    "host": "",
    "port": 16215,
    "user": "",
    "password": "",
    "database": "defaultdb",
    # cursorclass do mysqlPY já devolve dict em vez de tupla
    "cursorclass": pymysql.cursors.DictCursor,
}

def get_connection():
    """
    Abre uma conexão com o MySQL na Aiven usando PyMySQL.
    """
    conn = pymysql.connect(**DB_CONFIG)
    return conn
