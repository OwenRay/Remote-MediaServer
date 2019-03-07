Will return usefull debugging info

Can be hooked into by any module using `DebugApiHandler.registerDebugInfoProvider`

## Example output:
```json
{
  "scanner": {
    "currentLibrary": {
      "name": "movs",
      "folder": "/home/owenray/testmov",
      "type": "movie",
      "uuid": "95c91708-5004-42ae-8d50-4652f253d0b7",
      "shared": "on"
    },
    "scanning": -1,
    "extendedInfoQuelength": 0
  },
  "sharing": {
    "announcing": false,
    "publishQueueSize": 0,
    "publishing": false,
    "dht": {
      "nodes": [
        {
          "host": "1.2.3.4",
          "port": 8235
        }
      ],
      "values": {
        "50933682d171c9c144d1597538dfbe5cccab5139": {
          "v": "69615474486b756255705159314e4e676f5a4736324d5a6e5154536635762b574e49765a365952715332303d3436",
          "id": "2532abb040aaebe11f68a5a431ae4c5e9f22f7b3"
        },
        "e7a173369d107caecfec6d3c83ab1e618d5f005e": {
          "v": "469895332a97095237037473ddfe8619e64df739",
          "id": "2532abb040aaebe11f68a5a431ae4c5e9f22f7b3"
        }
      }
    }
  }
}

```
