const imageToBase64 = require('image-to-base64');
const nodeHtmlToImage = require('node-html-to-image');
const fs = require('fs');
var variables = require("./variables")

var template = '';

var getModule = (function(express){
        express.get('/test', async function (req, res) {
            readTemplateFile('./templates/modules/test.html',async function (err,templatefile){
                template=templatefile
                template = await retrieveWebcam(template)
                template = await retrieveThumbnail(template)
                template = await retrieveOverlay(template)
                template = await retrieveProgress(template)
                const image = await nodeHtmlToImage({html:template})
                res.type("image/png")
                res.send(image)
            });
        });
})
module.exports = getModule;

async function retrieveOverlay(inputtemplate){
    var base64overlay = await imageToBase64("./templates/overlay.png");
    var overlaytag = '{{overlay}}'
    inputtemplate = inputtemplate.replace(new RegExp(overlaytag,'g'),"data:image/gif;base64,"+base64overlay)
    return inputtemplate
}

async function retrieveWebcam(inputtemplate){
    var base64cam = await imageToBase64("https://elitepr1nt3r.eliteschw31n.de/frontcam/?action=snapshot");
    var webcamtag = '{{webcam}}'
    inputtemplate = inputtemplate.replace(new RegExp(webcamtag,'g'),"data:image/gif;base64,"+base64cam)
    return inputtemplate
}

async function retrieveThumbnail(inputtemplate){
    var thumbnailtag = '{{thumbnail}}'
    inputtemplate = inputtemplate.replace(new RegExp(thumbnailtag,'g'),"data:image/gif;base64,"+variables.getThumbnail)
    return inputtemplate
}

async function retrieveProgress(inputtemplate){
    var progresstag = '{{progress}}'
    inputtemplate = inputtemplate.replace(new RegExp(progresstag,'g'),variables.getPrintProgress)
    return inputtemplate
}

function readTemplateFile(path, callback) {
    try {
        fs.readFile(path, 'utf8', callback);
    } catch (e) {
        callback(e);
    }
}