const getColors = require('get-image-colors')
const path = require('path')

const imagePath = path.join(__dirname, 'public', 'png-PF.png')

getColors(imagePath).then(colors => {
    // colors is an array of color objects
    console.log('Colors found:')
    colors.map(color => console.log(color.hex()))
})
