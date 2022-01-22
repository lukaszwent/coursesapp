//Podajesz : Nazwa, Czas Trwania,img, ile obejrzałeś już minut : default:0 --procent ukończenia liczy ci apka 
const mongoose = require("mongoose");

const coursesSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    time:{
        type:Number,
        required:true
    },
    image:{
        type:String,
        default:"https://media.istockphoto.com/vectors/no-image-available-sign-vector-id922962354?b=1&k=20&m=922962354&s=170667a&w=0&h=gpsD4Kn3xGxc_CMswNa_twx-Nxf9og_ipyV_2rjCWj4=",
    },
    usersTime:{
        type:Number,
        default:0
    },
    isArchived:{
        type:Boolean,
        default:false
    },
    info:{
        type:String
    }
});

module.exports= mongoose.model("Course",coursesSchema);