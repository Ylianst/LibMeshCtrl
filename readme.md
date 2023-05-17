# LibMeshCtrl

Library for remotely interacting with a [MeshCentral](https://meshcentral.com/) server instance

## Installation

yarn add libmeshctrl

## Usage

This module is implemented as a primarily asynchronous library, mostly through the `Session` class, which is exported as default. Because the library is asynchronous, you must wait for it to be initialized before interacting with the server. The preferred way to do this is to use the static and asynchronous `create` function which is exposed on the Session class:
```javascript
import { Session } from "LibMeshCtrl"
let session = await Session.create(url, {options})

session.list_users()
...
```

However, if you prefer to instantiate the object yourself, you can simply use the `initialized` property:
```javascript
let session = new Session(url, {options})
await session.initialized
```

## Session Parameters
`url`: URL of meshcentral server to connect to. Should start with either "ws://" or "wss://".

`options`: POJO of optional parameters

Option | Description | Note
--- | --- | ---
`user` | Name of user to connect with | Can also be username generated from token
`domain` | Domain on server to connect to |
`password` | Password with which to connect | Can also be password generated from token
`loginkey` | Key from already handled login | Overrides username/password
`proxy` | "url:port" to use for proxy server |
`token` | Login token | This appears to be superfluous

## API
API is documented in the [API Docs](https://github.com/Ylianst/LibMeshCtrl/blob/main/doc/api.md)
