const Eleventy = require("@11ty/eleventy")

const st = require('st')
const http = require('http')

async function run(cmd) {
  switch(cmd) {
    case 'start': return start()
    case 'stop': return stop()
    default: throw new Error('Unknown command: ' + cmd)
  }
}
let eleventy = null
let started = false
let inputPath = null
let server = null
async function stop() {
  if(!started) return
  await eleventy.watcher.close()
  eleventy = null
  started = false
  server.close()
  document.body.classList.add('stopped')
  document.body.classList.remove('started')
}
async function start() {
  if(started) return
  console.log('starting', {inputPath})
	eleventy = new Eleventy(inputPath, inputPath + '/_site')
	await eleventy.init()
	await eleventy.write()
  updateFilesList()
  console.log({eleventy})
  await eleventy.watch()
  eleventy.watcher.on('change', onWatch)
  started = true
 
  server = http.createServer(
    st({
      path: inputPath + '/_site',
      cache: false,
    })
  ).listen(8080)
  
  document.body.classList.add('started')
  document.body.classList.remove('stopped')
}

const onWatch = (file) => {
  updateFilesList()
}

function updateFilesList(files = eleventy.writer.templateMap.map) {
  const filesList = document.querySelector('#filesList')
  const filesListTemplate = document.querySelector('#filesListTemplate').content
  filesList.innerHTML = ''
  filesList.appendChild(files.reduce((ul, file) => {
    const clone = filesListTemplate.cloneNode(true)
    Object.keys(file).forEach(fileProp => {
      const field = clone.querySelector('.' + fileProp)
      if(field) field.innerHTML = file[fileProp]
    })
    ul.appendChild(clone)
    return ul
  }, document.createElement('ul')))
}

function updatePath(path, cancel) {
  if(started) {
    cancel()
    return
  }
  inputPath = path
  const pathInput = document.querySelector('#path')
  if(pathInput.value != path) pathInput.value = path
}
(function() {
  updatePath('website', () => {})
})()
