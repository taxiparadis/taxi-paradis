const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./taxi.db");

db.serialize(() => {

    db.run(`
        CREATE TABLE IF NOT EXISTS soferi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            indicativ TEXT UNIQUE,
            parola TEXT,
            nume TEXT,
            telefon TEXT,
            masina TEXT,
            activ INTEGER DEFAULT 1,
            online INTEGER DEFAULT 0
        )
    `);

    db.run(`
        INSERT OR IGNORE INTO soferi
        (indicativ, parola, nume, masina)
        VALUES
        ('1','1234','Sofer Test 1','Dacia'),
        ('2','5678','Sofer Test 2','Logan'),
        ('3','9999','Sofer Test 3','Skoda')
    `);

});

module.exports = db;
