const express = require('express');
const cons = require('consolidate');
const dust = require('dustjs-linkedin');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const mime = require('mime');
const multer = require('multer');
const path = require('path');
const shortid = require('shortid');

var dusthelp = require('dustjs-helpers');
var fs = require('fs');


const PORT = 5000;

var app = express();

const profile_path = __dirname + '/profile_pic/';

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/test');

//access css files
app.use(express.static(__dirname + '/public'));

app.use(bodyParser.urlencoded({ extended: true }));

app.set('port', PORT);


//multer to identify save file with extension
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profile_path)
    },
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            cb(null, raw.toString('hex') + Date.now() + '.' + mime.extension(file.mimetype));
        });
    }
});

//initialization of file upload location
var upload = multer({
    dest: profile_path,
    storage: storage
});

//view engine as dust
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');




var Schema = mongoose.Schema;

//profile schema for mongo db
var profileDataSchema = new Schema({
    uniqueId:{ type: String, required: true, default: shortid.generate },
    profilename: String,
    bio: String,
    gitUrl: String,
    stackUrl: String,
    linkedinUrl: String,
    education: String,
    skills: Object,
    awards: String,
    likes: String,
    languages: String,
    userimg: String,
    createdate: { type: Date, required: true, default: Date.now }
}, { collection: 'resumeData' });


//mongo db schema
var ProfileData = mongoose.model('ProfileData', profileDataSchema);

app.get('/', function (req, res) {
    ProfileData.find(function (err, data) {
        if (err) {
            res.status(500);
            res.send('Internal server error');
        } else {
            res.status(200);
            res.render('index', { data: data });
        }
    });

});

app.get('/findUser', function (req, res) {

   // var objectId = 'ObjectId("'+req.query.username+'")';
    //console.log(objectId);

    var uniqueId = req.query.uniqueId;

    ProfileData.find({ uniqueId: uniqueId }, function (err, data) {
        if (err) {
            res.status(500);
            res.send('Internal server error');
        } else {
            res.status(200);
            res.render('preview', { data: data });
        }
    });
});

app.get('/delete', function (req, res) {
    ProfileData.remove({ uniqueId: req.query.uniqueId }, function (err, data) {
        if (err) {
            res.status(500);
            res.send('Internal server error');
        } else {
            res.status(200);
            res.render('delete');
        }
    });
});


app.get('/new', function (req, res) {
    res.render('newprofile');
});

app.post('/save', upload.single('profile'), function (req, res) {

    console.log(req.body);
    console.log("File path: " + req.file.path);
    var profile_loc = req.file.path;
    var relFileName = req.file.filename;

     console.log(req.body.skillHide);


    var profile = {
        profilename: req.body.txtName,
        bio: req.body.txtBio,
        gitUrl: "http://github.com" + req.body.txtGitLink,
        stackUrl: "http://stackoverflow.com" + req.body.txtStack,
        linkedinUrl: "http://linkedin.com" + req.body.txtLinkedin,
        education: req.body.txtEducation,
        skills: JSON.parse(req.body.skillHide),
        awards: req.body.txtAwards,
        likes: req.body.txtLikes,
        languages: req.body.txtLanguages,
        userimg: relFileName
    };

    var data = new ProfileData(profile);
    data.save(function (err, user) {
        console.log('Data Saved');
    });
    console.log(req.body);
    res.render('save', {
        name: req.body.txtName
    });
});

//get details api route
app.get('/getdetails', function (req, res) {
    ProfileData.find(function (err, data) {
        if (err) {
            res.status(500);
            res.send('Internal server error');
        } else {
            res.status(200);
            res.json(data);
        }
    });
});

//show thumbnail for user
app.get('/thumbnail', function (req, res) {
    var location = req.query.loc;
    var fileLoc = './profile_pic/' + req.query.loc;
    console.log(location);
    res.sendfile(path.resolve(fileLoc));
})


app.listen(PORT);
console.log(`Server running on http://localhost:${PORT}`);
