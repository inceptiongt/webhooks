var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var config = require('./config.json')
var Hook = require('./hook')
var async = require('async')
var logger = require('express-req-logger')

// var repository = config.repository || []
// var hooks = repository.map(function (item) {
//   return new Hook(item)
// })
var hooks = [new Hook(config)]

app.use(logger())
app.use(bodyParser.json())
// app.use(bodyParser.urlencoded({
//   extended: true
// }))

app.post('/', function (req, res, next) {
  var eventType = getHeaders(req.headers, 'X-GitHub-Event') || req.body.event
  var body = req.body
  var data = {
    https_url: body.repository ? body.repository.clone_url : '',
    ssh_url: body.repository ? body.repository.ssh_url : '',
    ref: body.ref || 'master',
    token: body.token || ''
  }
  // console.log(body)
  if (eventType === 'push') {
    async.map(hooks, function (item, next) {
      item.pull(data, next)
    }, function (err, result) {
      if (err) {
        return res.status(500).send(err)
      }
      console.log(result.join(''))
      res.end(result.join(''))
    })

  } else {
    res.end()
  }
})

var getHeaders = function (headers, name) {
  var reg = new RegExp(name, 'i')
  for (var key in headers) {
    if (reg.test(key)) {
      return headers[key]
    }
  }
}

var port = config.port || 4040

app.listen(port, () => {
  console.log('server start at ' + port)
})