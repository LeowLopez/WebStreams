import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { Readable, Transform } from 'node:stream'
import { WritableStream, TransformStream } from 'node:stream/web'

import csvtojson from 'csvtojson'

const PORT = 3000
createServer(async (request, response) => {

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
    }

    if (request.method === 'OPTIONS') {
        response.writeHead(204, headers)
        response.end()
        return;
    }
    
    // Only works in Node
    // createReadStream('./animeflv.csv')
    // .pipe(response)
    
    let cont = 0;
    
    request.once('close', _ => console.log(`req connection was closed! Cont: `, cont))
    
    // To use in Web:
    Readable.toWeb(createReadStream('./animeflv.csv'))
        //for each item that will be transported
        .pipeThrough(new Transform.toWeb(csvtojson()))
        //yes, could be used more than one time
        .pipeThrough(new TransformStream({
            transform(chunk, controller){
                const data = JSON.parse(Buffer.from(chunk))
                const mappedData = {
                    title: data.title,
                    description: data.description,
                    url_anime: data.url_anime
                }
                //breakline (ndJson)
                controller.enqueue(JSON.stringify(mappedData).concat('\n'))
            }
        }))
        //last step
        .pipeTo(new WritableStream({
            write(chunk) {
                cont++
                response.write(chunk)
            },
            close() {
                response.end()
            }
        }))


    response.writeHead(200, headers)
})

    .listen(PORT)
    .on('listening', _ => console.log(`Server is running at ${PORT}`))