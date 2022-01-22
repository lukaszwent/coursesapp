
const express = require("express");
const methodOverride = require("method-override");
require("dotenv").config();
const path = require("path");
const PORT = process.env.PORT || 3000;
const DB_HOST = process.env.DB_HOST;
const app = express();
const {connect} = require("./db");
const coursesSchema = require('./models/courses');
const ejsmate = require("ejs-mate");

connect(DB_HOST);

app.engine("ejs",ejsmate);
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, 'public')))
/*
Podajesz : Nazwa, Czas Trwania,img, ile obejrzałeś już minut : default:0 --procent ukończenia liczy ci apka 
    GET /                           -Homepage
    GET /courses                    -Wszystkie kursy użytkownika(które po kliknięciu rozciagają szczególy) po 5 na strone
    POST /courses                   -Dodaj nowy kurs
    -------------------GET /courses/new                -Nowy formularz dodawaniu kursów
    GET /courses/:id                -Wyświetla szczegóły danego kursu
    PATCH /courses/:id              -Umożliwia zmiane konkretnej wartości reszta , wybiera ją klikając na szare pole i wpisując nową wartość
    DELETE /courses/:id             -Usuwa dany kurs
    PATCH /courses/:id/addMinutes   -Umożliwia dodanie ilości objerzanych minut w kursie
*/

app.get("/",(req,res)=>{
    res.render("home");
})
app.get("/courses",async(req,res)=>{
    const allcourses = await coursesSchema.find({isArchived:false});
    //console.log(allcourses);
    res.render("courses/index",{allcourses});
})
app.post("/courses",async (req,res)=>{

    const btime = req.body.timeFormat === "hours" ? req.body.time *60 : req.body.time;
    if(!req.body.image)
        delete req.body.image;
    let reqBody = {...req.body,time: btime};
    const course = new coursesSchema({...reqBody});
    course.save();
    res.redirect("/courses");
})

app.get("/courses/new",(req,res)=>{
    res.render("courses/newForm");
})

app.get("/courses/:id",async (req,res)=>{
    const course = await coursesSchema.findById(req.params.id);
    res.render("courses/show",{course});
})

app.get("/courses/:id/edit",async (req,res)=>{
    const course = await coursesSchema.findById(req.params.id);
    res.render("courses/editForm",{course});
})

app.put("/courses/:id",async (req,res)=>{
    //console.log(req.body);
    await coursesSchema.findByIdAndUpdate({_id:req.params.id},req.body);
    
    res.redirect(`/courses/${req.params.id}`);
})
app.delete("/courses/:id",async (req,res)=>{
    await coursesSchema.findByIdAndDelete(req.params.id);
    res.redirect("/courses");
})
app.patch("/courses/:id/addMinutes", async(req,res)=>{ 
    const course = await coursesSchema.findById(req.params.id);
    let amount=course.usersTime;
    if(amount+parseInt(req.body.usersTime) <= course.time){
        course.usersTime +=parseInt(req.body.usersTime);
        await course.save();
    }
    if(req.query.show){
        res.redirect(`/courses/${req.params.id}`);
    }else{
        res.redirect("/courses");
    }
    
})

app.patch("/courses/:id/archive",async(req,res)=>{
    const course = await coursesSchema.findById(req.params.id);
    course.isArchived = true;
    await course.save();
    res.redirect("/courses");
})

app.patch("/courses/:id/reset",async (req,res)=>{
    await coursesSchema.findByIdAndUpdate({_id:req.params.id},{usersTime:0,isArchived:false});
    res.redirect("/courses")
})

app.get("/history",async (req,res)=>{
    const allcourses = await coursesSchema.find({isArchived:true});

    res.render("history",{allcourses});
})

app.listen(PORT,()=>{
    console.log(`Serwer nasłuchuje na localhost:${PORT}`);
})

