import express, { json } from "express"
import path, { join } from "path"
import {fileURLToPath} from 'url'
import mongodb from 'mongodb'

const { MongoClient, ServerApiVersion } = mongodb
const uri = "";
let client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
let collection, closed

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const port = 8080

//use allows to specify any kinda of middleware: possible solution with decorators

app.use(json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(join(__dirname, 'static')))

//Normal Endpoints
app.get('/', (req, res) => {
    let {user} = req.body
    res.sendFile(join(__dirname, 'static','assets', 'html', 'index.html'))
})

app.get('/admin', (req, res) => {
  res.sendFile(join(__dirname, 'static','assets', 'html', 'admin.html'))
})

//API Rest-Endpoints - user
app.get('/api/findInRadius', async (req, res) => {
    const { lng, ltd, radius } = req.query

    if (lng == null | ltd == null | radius == null) res.sendStatus(400)
    try {
        const results = await collection.find(
          {
            "indirizzo.location": {
                  $near: { $geometry: {
                      type: "Point", coordinates: [ +ltd, +lng ] }, $maxDistance: +radius 
                  } 
                }
          }
        ).project({location : "$indirizzo.location", operativo: 1}).toArray()
        
        res.json(results)
    } catch(err) {
        console.log(err)
    }
})

app.get('/api/get/:id', async (req, res) => {
    try {
        const { id } = req.params
        const result = await collection.findOne(mongodb.ObjectID(id))
        res.json(result)    
    } catch (err) {
        console.log(err)
    }
})

//la ricerca è condotta solo su biblioteche operative
app.get('/api/search', async (req, res) => {
    try {
        const {nome, lng, ltd} = req.query
        const result = await collection.aggregate(
            [
                {
                  '$search': {
                    'index': 'autocomplete', 
                    'compound': {
                      'must': {
                        'autocomplete': {
                          'query': nome, 
                          'path': 'nome'
                        }
                      }, 'should' : {
                        'near': {
                          'origin': {
                            'type': 'Point', 
                            'coordinates': [
                              +ltd, +lng
                            ]
                          },
                          'pivot': 1000, 
                          'path': 'indirizzo.location'
                      }
                      }
                    }
                  }
                }, {
                  '$limit': 10
                }, {
                  '$project': {
                    nome: 1,
                    location: "$indirizzo.location",
                    _id: 1
                  }
                }
              ]   
        ).toArray()

        res.send(result)
    } catch (error) {
        console.log(error)
    }
})

//API Rest-Endpoints - admin
app.post('/api/create' , async (req, res) => {
  try {
    let library = req.body
    let {indirizzo: {location: {coordinates = []}}} = library
    if (coordinates.length == 0) throw "no Coordinates"

    library.indirizzo.location.coordinates = coordinates.map((e) => Number(e))
    await collection.insertOne(library)
    res.sendStatus(200).end()
  } catch (error) {
    console.log(error)
    res.sendStatus(400).end()
  }  
})

app.post('/api/trasferimento/:id', async (req, res) => {
    try {
        let { id } = req.params
        let address = req.body
        let {location: {coordinates = []}} = address
        if (coordinates.length == 0) throw "no Coordinates"

        address.location.coordinates = coordinates.map((e) => Number(e))
        await collection.updateOne({"_id": mongodb.ObjectID(id)}, { $set: { "indirizzo" : address}})
        res.sendStatus(200).end();
    } catch(err) {
        console.log(err)
        res.sendStatus(400).end()
    }
}) 

app.get('/api/getAll', async (req, res) => {
  res.json(await collection.find().toArray())
})

app.post('/api/close/:id', async (req, res) => {
    const session = client.startSession()
    
    try {
        await session.withTransaction(async () => {
          let { id } = req.params
          let mongoId = mongodb.ObjectID(id)
          let result = await collection.findOne({"_id": mongoId}, {_id: 0})
          
          result.dataChiusura = new Date(Date.now())
          await collection.deleteOne({"_id": mongoId})
          await closed.insertOne(result)
        })
        await session.endSession()
        res.sendStatus(200)
    } catch(err) {
        console.log(err)
        res.status(400)
    }
}) 

app.listen(port, async () => {
    try {
        client = await client.connect()
        collection = client.db('locations').collection('libraries')
        closed = client.db('locations').collection('closedLibraries')
        console.log(`connection is ${client.isConnected()}\n`, `server is running on port ${port}...`)
    } catch (err) {
        console.log(err)
    }
})

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server')
    server.close(() => {
      client.close()
      console.log('HTTP server closed')
    })
  })