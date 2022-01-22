const mongoose = require("mongoose");

module.exports = {
    connect:(DB_HOST)=>{
        mongoose.connect(DB_HOST);

        mongoose.connection.on('error',err=>{
            console.error(err);
            console.log("Błąd połączenia z MongoDB");
            process.exit();
        });

        mongoose.connection.once('open',()=>{
            console.log("Baza danych połączona")
        })
    }
}