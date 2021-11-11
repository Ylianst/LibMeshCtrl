/**
* @description API for remotely interacting with a MeshCentral server instance
* @author Josiah Baldwin
* @copyright Intel Corporation 2021-2021
* @license Apache-2.0
* @version v1.0.0
*/

import https_proxy_agent from 'https-proxy-agent'
import crypto from 'crypto'
import path from "path"
import fs from "fs"
import ws from "ws"
import { default as urllib } from "url" //We use url as a variable down there a lot, so namespace this as a library
import stream from "stream"
import EventEmitter from 'events'

"use strict"

class _Deferred {
    constructor() {
        this.resolved = false
        this.rejected = false
        this.promise = new Promise((resolve, reject)=> {
          this.reject = reject
          this.resolve = resolve
        })
        this.promise.then(()=>{
            this.resolved = true
        }, ()=>{
            this.rejected = true
        })
        this.then = this.promise.then.bind(this.promise)
        this.finally = this.promise.finally.bind(this.promise)
    }
}

let _compare_obj = (obj1, obj2)=>{
    for (let [key, val] of Object.entries(obj1)) {
        if (!obj2[key]) {
            return false
        }
        if (val instanceof Object) {
            if (!_compare_obj(val, obj2[key])) {
                return false
            }
        } else if (val instanceof Set) {
            for (let v of val) {
                try {
                    let sentinel = false
                    for (let v2 of obj2[key]) {
                        sentinel |= _compare_obj(v, v2)
                        if (sentinel) { break }
                    }
                    if (!sentinel) {
                        return false
                    }
                } catch (err) {
                    return false
                }
            }
        } else if (val instanceof Array) {
            try {
                for (let [i, v] of val.entries()) {
                    if (!_compare_obj(v, obj2[key])) {
                        return false
                    }
                }
                if (val.length !== obj2[key].length) {
                    return false
                }
            } catch (err) {
                return false
            }
        } else if (obj2[key] !== val) {
            return false
        }
    }
    return true
}

let _make_enum = (properties, {start_value=0x0, use_string=false}={})=>{
    let e = {},
        value = start_value
    for (let prop of properties) {
        e[prop] = value
        if (use_string) {
            e[prop] = prop
        }
        value++
    }
    return e
}

let _make_bitwise_enum = (properties, {all_prop=null, none_prop=null, start_value=0x1}={})=> {
    let e = {},
        value = start_value
    for (let prop of properties) {
        e[prop] = value
        value <<= 1
    }
    if (all_prop) {
        let all_value = value>>1
        while (value>>=1 >= start_value) {
            all_value |= value
        }
        e[all_prop] = all_value
    }
    if (none_prop) {
        e[none_prop] = 0x0
    }
    return e
}


const USERRIGHTS = _make_bitwise_enum(['backup', 'manageusers', 'restore', 'fileaccess', 'update', 'locked', 'nonewgroups', 'notools', 'usergroups', 'recordings', 'locksettings', 'allevents'], {all_prop:"fullrights", none_prop: "norights"})
const MESHRIGHTS = _make_bitwise_enum(["editgroup", "manageusers", "manageddevices", "remotecontrol", "agentconsole", "serverfiles", "wakedevices", "notes", "desktopviewonly", "noterminal", "nofiles", "noamt", "limiteddesktop", "limitedevents", "chatnotify", "uninstall", "noremotedesktop", "remotecommands", "resetpoweroff"], {all_prop:"fullrights", none_prop: "norights"})

const CONSENTFLAGS = _make_bitwise_enum(["desktopnotify", "terminalnotify", "filesnotify", "desktopprompt", "terminalprompt", "filesprompt", "desktopprivacybar"], {all_prop:"all", none_prop: "none"})

const SHARINGTYPE = _make_enum(["desktop", "terminal"], {use_string: true})
const SHARINGTYPENUM = _make_enum(["desktop", "terminal"], {start_value: 0x1})

class Session {
    constructor(url, {user=null, domain=null, password=null, loginkey=null, proxy=null, token=null}) {
        if (url.length < 5 || (!url.startsWith('wss://') && (!url.startsWith('ws://')))) {
            throw Error("Invalid URL")
        }
        if (url.endsWith('/') == false) {
            url += '/'
        }
        url += 'control.ashx'
        if (user == null || (password == null && loginkey == null)) {
            throw Error("No login credentials given")
        }
        if (loginkey) {
            try {
                loginkey = fs.readFileSync(loginkey)
            } catch (err) {
                if (err.code == "ENOENT") {

                }
                else {
                    throw err
                }
            }
            if (loginkey.length != 160) { 
                throw Error("Invalid login key")
            }
            loginkey = Buffer.from(loginkey, 'hex')
            if (ckey.length != 80) {
                throw Error("Invalid login key.")
            }
            let domainid = '',
                username = 'admin'
            if (domain != null) { domainid = domain }
            if (user != null) { username = user }
            url += '?auth=' + encodeCookie({ userid: 'user/' + domainid + '/' + username, domainid: domainid }, loginkey);
        }
        if (token != null) {
            token = ',' + Buffer.from('' + token).toString('base64');
        }
        this.url = url
        this._proxy = proxy
        this._user = user
        this._domain = domain
        this._password = password
        this._token = token
        this._loginkey = loginkey
        this._sock = null
        this._socket_open = new _Deferred()
        this._inflight = new Set()

        this._eventer = new EventEmitter()

        this.initialized = new _Deferred()

        this._initialize()

        this._server_info = {}
        this._user_info = {}
        this._command_id = 0
        this.alive = false
    }

    static async create(...args) {
        let s = new this(...args)
        await s.initialized
        return s
    }

    _on_verify_server(clientName, certs) { return null; }

    _initialize() {
        let options = { rejectUnauthorized: false, checkServerIdentity: this._on_verify_server }

        // Setup the HTTP proxy if needed
        if (this._proxy != null) {
            options.agent = new https_proxy_agent(urllib.parse(this._proxy))
        }
        if (this._password) {
            let token = this._token || ""
            options.headers = { 'x-meshauth': Buffer.from('' + this._user).toString('base64') + ',' + Buffer.from('' + this._password).toString('base64') + token }
        }
        this._sock = new ws(this.url, options)

        this._sock.on("open", () => {
            this._socket_open.resolve()
            this.alive = true
        })
        this._sock.on('close', (arg, arg2) => {
            if (!this.initialized.resolved) {
                this.initialized.reject("Closed")
            }
            this.alive = false
        });
        this._sock.on('error', (err) => {
            this._socket_open.reject(err.code)
            this.initialized.reject(err.code)
            this.alive = false
        });
        this._sock.on('message', this._receive_message.bind(this))
    }

    _receive_message(raw_data) {
        // console.log("message")
        var data = null;
        data = JSON.parse(raw_data)
        // console.log(data)
        if (data.action == "serverinfo") {
            this._currentDomain = data.serverinfo.domain;
            this._server_info = data.serverinfo
            return
        }
        if (data.action == "userinfo") {
            this._user_info = data.userinfo
            this.initialized.resolve()
            return
        }
        if (data.action == "event" || data.action == "msg" || data.action == "interuser") {
            this._eventer.emit("server_event", data)
        }
        if (data.responseid) {
            this._eventer.emit(data.responseid, data)
        }
        else {
            // Some events don't user their response id, they just have the action. This should be fixed eventually.
            // Broken commands include:
            //      meshes
            //      nodes
            //      getnetworkinfo
            //      lastconnect
            //      getsysinfo
            // console.log(`emitting ${data.action}`)
            this._eventer.emit(data.action, data)
        }
    }

    _get_command_id(){
        // Limit command ids to 32-bit integers because javascript doesn't have arbitrarily large numbers and they start getting weird
        this._command_id = (this._command_id+1)%(2**32-1)
        return this._command_id
    }

    close() {
        this._sock.close()
    }

    async server_info() {
        return this._server_info
    }

    async user_info() {
        return this._user_info
    }

    async _send_command(data, name) {
        let id
        // This fixes a very theoretical bug with hash colisions in the case of an infinite number of requests. Now the bug will only happen if there are currently 2**32-1 of the same type of request going out at the same time.
        while (this._inflight.has(id = `meshctrl_${name}_${this._get_command_id()}`)){}
        this._inflight.add(id)
        let p = new Promise((resolve, reject)=>{
            this._eventer.once(id, (data)=>{
                this._inflight.delete(id)
                resolve(data)
            })
        })
        this._sock.send(JSON.stringify(Object.assign({}, data, { responseid: id })))
        return p
    }

    // Some commands don't use response id in return, for some reason
    // Hopefully this bug gets fixed. If so, remove this function and fix everything using it
    async _send_command_no_response_id(data) {
        let p = new Promise((resolve, reject)=>{
            this._eventer.once(data.action, (data)=>{
                resolve(data)
            })
        })
        this._sock.send(JSON.stringify(data))
        return p
    }

    async send_invite_email(group, email, {name=null, message=null, meshid=null}={}){
        var op = { action: 'inviteAgent', email: email, name: '', os: '0' }
        if (meshid) { op.meshid = meshid } else if (group) { op.meshname = group }
        if (name) { op.name = name }
        if (message) { op.msg = message }
        return this._send_command(op, "send_invite_email")
    }

    async generate_invite_link(group, hours, {flags=null, meshid=null}={}) {
        var op = { action: 'createInviteLink', expire: hours, flags: 0 }
        if (meshid) { op.meshid = meshid; } else if (group) { op.meshname = group; }
        if (flags) { op.flags = flags; }
        return this._send_command(op, "generate_invite_link")
    }

    async list_users() {
        return this._send_command({action: "users"}, "list_users")
    }

    async list_user_sessions() {
        return this._send_command({action: "socketsessioncount"}, "list_user_sessions")
    }

    async list_user_groups() {
        return this._send_command({action: "usergroups"}, "list_user_groups")
    }

    async list_device_groups() {
        // Hack, fix when meshes returns responseid
        let p = new Promise((resolve, reject)=>{
            this._eventer.once("meshes", (data)=>{
                resolve(data)
            })
        })
        this._send_command({action: "meshes"}, "list_device_groups")
        return p
    }

    async list_devices({details=false, group=null, meshid=null}={}) {
        let command_list = []
        if (details) {
            command_list.push(this._send_command({action: "getDeviceDetails", type:"json"}, "list_devices"))
        } else if (group) {
            // command_list.push(this._send_command({ action: 'nodes', meshname: group}, "list_devices"))
            command_list.push(this._send_command_no_response_id({ action: 'nodes', meshname: group }))
        } else if (meshid) {
            // command_list.push(this._send_command({ action: 'nodes', meshid: meshid}, "list_devices"))
            command_list.push(this._send_command_no_response_id({ action: 'nodes', meshid: meshid }))
        } else {
            // Hack, fix when meshes returns responseid
            // command_list.push(this._send_command({ action: 'meshes' }, "list_devices"))
            // command_list.push(this._send_command({ action: 'nodes' }, "list_devices"))
            command_list.push(this._send_command_no_response_id({ action: 'meshes' }))
            command_list.push(this._send_command_no_response_id({ action: 'nodes' }))
            
        }
        return await Promise.all(command_list).then((args)=>{
            if (details) {
                return args[0]
            } else if (group) {
                return args[0]
            } else if (meshid) {
                return args[0]
            }
            if (args[1].result === null) {
                return args[1]
            }
            let xmeshes = {}
            let nodes = []
            for (let i in args[0].meshes) { xmeshes[args[0].meshes[i]._id] = args[0].meshes[i]; }
            for (let i in args[1].nodes) {
                const devicesInMesh = args[1].nodes[i];
                for (let j in devicesInMesh) {
                    devicesInMesh[j].meshid = i; // Add device group id
                    if (xmeshes && xmeshes[i] && xmeshes[i].name) { devicesInMesh[j].groupname = xmeshes[i].name; } // Add device group name
                    nodes.push(devicesInMesh[j]);
                }
            }
            return nodes
        })
    }

    async list_users_of_device_group(meshid) {
        // Hack, fix when meshes returns responseid
        //return await this._send_command({ action: 'meshes' }, "list_users_of_device_group").then(data)=>{
        return await this._send_command_no_response_id({ action: 'meshes' }).then((data)=>{
            for (var i in data.meshes) {
                const m = data.meshes[i];
                const mid = m._id.split('/')[2]
                if (mid == meshid) {
                    return m.links
                }
            }
            throw Error("Group ID not found")
        })
    }

    // Return f so we can stop listening to this if needed
    listen_to_events(f, filter=null) {
        let f2 = (data)=>{
            if (filter) {
                if (_compare_obj(filter, data)) {
                    f(data)
                }
            } else {
                f(data)
            }
        }
        this._eventer.on("server_event", f2)
        return f2
    }

    // Uses the function returned from listen_to_events
    stop_listening_to_events(f) {
        this._eventer.off("server_event", f)
    }

    async list_events({userid=null, nodeid=null, limit=null}) {
        if ((typeof limit != 'number') || (limit < 1)) { limit = null; }

        let cmd = null;
        if (userid) {
            cmd = { action: 'events', user: userid }
        } else if (nodeid) {
            cmd = { action: 'events', nodeid: nodeid }
        } else {
            cmd = { action: 'events' }
        }
        if (typeof limit == 'number') { cmd.limit = limit; }
        return this._send_command(cmd, "list_events")
    }

    async add_login_token(name, expire=null) {
        let cmd = { action: 'createLoginToken', name: name, expire: 0 }
        if (expire) { cmd.expire = expire }
        return this._send_command(cmd, "add_login_token")
        
    }

    async remove_login_token(name) {
        return this._send_command({ action: 'loginTokens', name: name }, "remove_login_token")
    }

    async add_user(name, password, randompass, {domain=null, email=null, emailverified=false, resetpass=false, realname=null, phone=null, rights=null}) {
        // Rights uses USERRIGHTS
        if (randompass) { password = this._getRandomAmtPassword() }
        let op = { action: 'adduser', username: name, pass: password };
        if (email) { op.email = email; if (emailverified) { op.emailVerified = true; } }
        if (resetpass) { op.resetNextLogin = true; }
        if (rights !== null) { op.siteadmin = rights }
        if (domain) { op.domain = domain }
        else if (this._domain) { op.domain = this._domain }
        if (phone === true) { op.phone = ''; }
        if (typeof phone == 'string') { op.phone = phone }
        if (typeof realname == 'string') { op.realname = realname }
        return this._send_command(op, "add_user")
    }

    async edit_user(userid, {domain=null, email=null, emailverified=false, resetpass=false, realname=null, phone=null, rights=null}) {
        // Rights uses USERRIGHTS
        if ((domain != null) && (userid.indexOf('/') < 0)) { userid = 'user/' + domain + '/' + userid; }
        else if ((this._domain != null) && (userid.indexOf('/') < 0)) { userid = 'user/' + this._domain + '/' + userid; }
        let op = { action: 'edituser', userid: userid};
        if (email) { op.email = email; if (emailverified) { op.emailVerified = true; } }
        if (resetpass) { op.resetNextLogin = true; }
        if (rights !== null) { op.siteadmin = rights; }
        if (domain) { op.domain = domain; }
        else if (this._domain) { op.domain = this._domain }
        if (phone === true) { op.phone = ''; }
        if (typeof phone == 'string') { op.phone = phone; }
        if (typeof realname == 'string') { op.realname = realname; }
        if (realname === true) { op.realname = ''; }
        return this._send_command(op, "edit_user")
    }

    async remove_user(userid) {
        if ((this._domain != null) && (userid.indexOf('/') < 0)) { userid = 'user/' + this._domain + '/' + userid; }
        return this._send_command({ action: 'deleteuser', userid: userid }, "remove_user")
    }

    async add_user_group(name, description=null) {
        let op = { action: 'createusergroup', name: name, desc: desc };
        if (this._domain) { op.domain = this._domain }
        return this._send_command(op, "add_user_group")
    }

    async remove_user_group(groupid) {
        let ugrpid = groupid;
        if ((this._domain != null) && (userid.indexOf('/') < 0)) { ugrpid = 'ugrp/' + this._domain + '/' + ugrpid; }
        return this._send_command({ action: 'deleteusergroup', ugrpid: ugrpid }, "remove_user_group")
    }

    async add_to_user_group(id, groupid, rights=null) {
        // rights uses MESHRIGHTS


        var ugrpid = groupid;

        if ((this._domain != null) && (id.indexOf('/') < 0)) { ugrpid = 'ugrp/' + this._domain + '/' + ugrpid; }

        if ((id != null) && (id.startsWith('user/'))) {
            return this._send_command({ action: 'addusertousergroup', ugrpid: ugrpid, usernames: [id.split('/')[2]]}, "add_to_user_group")
        }

        rights = rights || 0

        if ((id != null) && (id.startsWith('mesh/'))) {
            return this._send_command({ action: 'addmeshuser', meshid: id, userid: ugrpid, meshadmin: rights}, "add_to_user_group")
        }

        if ((id != null) && (id.startsWith('node/'))) {
            return this._send_command({ action: 'adddeviceuser', nodeid: id, userids: [ugrpid], rights: rights}, "add_to_user_group")
        }
    }

    async remove_from_user_group(id, groupid) {
        var ugrpid = groupid;

        if ((this._domain != null) && (id.indexOf('/') < 0)) { ugrpid = 'ugrp/' + this._domain + '/' + ugrpid; }

        if ((id != null) && (id.startsWith('user/'))) {
            return this._send_command({ action: 'removeuserfromusergroup', ugrpid: ugrpid, userid: id }, "remove_from_user_group")
        }

        if ((id != null) && (id.startsWith('mesh/'))) {
            return this._send_command({ action: 'removemeshuser', meshid: id, userid: ugrpid }, "remove_from_user_group")
        }

        if ((id != null) && (id.startsWith('node/'))) {
            return this._send_command({ action: 'adddeviceuser', nodeid: id, userids: [ugrpid], rights: 0, remove: true }, "remove_from_user_group")
        }
    }

    async remove_all_users_from_user_group(groupid) {
        let ugrpid = groupid
        return this.list_user_groups().then((data)=>{
            // if ((this._domain != null) && (this._userid.indexOf('/') < 0)) { ugrpid = 'ugrp/' + this._domain + '/' + ugrpid; }
            let ugroup = data.ugroups[ugrpid]
            if (ugroup == null) {
                return {"response": "failure"}
            } else {
                let responses = []
                if (ugroup.links) {
                    for (let link_name of ugroup.links) {
                        if (link_name.startsWith('user/')) {
                            responses.push(this.remove_from_user_group(link_name, ugrpid))
                        }
                    }
                }
                if (!responses.length) { 
                    return {"response": "failure"} 
                }
                return Promise.all(responses)
            }
        })
    }

    async add_device_group(name, {description="", amtonly=false, features=0, consent=0}) {
        var op = { action: 'createmesh', meshname: name, meshtype: 2 };
        if (description) { op.desc = description; }
        if (amtonly) { op.meshtype = 1 }
        if (features) { op.flags = features }
        if (consent) { op.consent = consent }
        return this._send_command(op, "add_device_group")
    }

    async remove_device_group(meshid, isname=false) {
        var op = { action: 'deletemesh', meshid: meshid};
        if (isname) {
            op.meshname = meshid
            delete op.meshid
        }
        return this._send_command(op, "remove_device_group")
    }

    async edit_device_group(meshid, {isname=false, name=null, description=null, flags=null, consent=null, invite_codes=null, backgroundonly=false, interactiveonly=false}) {
        var op = { action: 'editmesh', meshid: meshid};
        if (isname) {
            op.meshname = meshid
            delete op.meshid
        }
        if (name !== null) { op.meshname = name }
        if (description !== null) { op.desc = description }
        if (invite_codes === true) { 
            op.invite = "*"
        } else if (invite_codes !== null) {
            op.invite = { codes: invite_codes, flags: 0 };
            if (backgroundonly === true) { op.invite.flags = 2; }
            else if (interactiveonly === true) { op.invite.flags = 1; }
        }
        if (flags !== null) {
            op.flags = flags
        }
        if (consent != null) {
            op.consent = consent
        }
        return this._send_command(op, "edit_device_group")
    }

    async move_to_device_group(meshid, nodeids, isname=false) {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        var op = { action: 'changeDeviceMesh', nodeids: nodeids, meshid: meshid };
        if (isname) {
            op.meshname = meshid
            delete op.meshid
        }
        return this._send_command(op, "move_to_device_group")
    }

    async add_users_to_device_group(meshid, userids, {isname=false, rights=0}) {
        // Rights = MESHRIGHTS
        if (typeof(userids) === "string") { userids = [userids] }
        var op = { action: 'addmeshuser', usernames: userids, meshadmin: rights, meshid: meshid };
        if (isname) {
            op.meshname = meshid
            delete op.meshid
        }
        return this._send_command(op, "add_user_to_device_group")
    }

    async remove_users_from_device_group(meshid, userids, isname=false) {
        let requests = []
        let id_obj = {}
        if (isname) {
            id_obj.meshname = meshid
            delete id_obj.meshid
        }
        if (typeof(userids) === "string") { 
            return this._send_command(Object.assign({}, { action: 'removemeshuser', userid: userids }, id_obj), "remove_users_from_device_group")
        }
        for (let userid of userids) {
            requests.push(this._send_command(Object.assign({}, { action: 'removemeshuser', userid: userids }, id_obj), "remove_users_from_device_group"))
        }
        return Promise.all(requests)
    }

    async add_users_to_device(nodeid, userids, rights=0) {
        // Rights = MESHRIGHTS
        if (typeof(userids) === "string") { userids = [userids] }
        return this._send_command({ action: 'adddeviceuser', nodeid: nodeid, usernames: [args.userid], rights: rights }, "add_users_to_device")
    }

    async remove_users_from_device(nodeid, userids) {
        if (typeof(userids) === "string") { userids = [userids] }
        return this._send_command({ action: 'adddeviceuser', nodeid: nodeid, usernames: userids, rights: 0, remove: true }, "remove_users_from_device")
    }

    async broadcast(message, {userid=null}) {
        var op = { action: 'userbroadcast', msg: message };
        if (userid) { op.userid = userid }
        return this._send_command(op, "broadcast")
    }

    async device_info(nodeid) {
        let requests = []
        // All of these are broken
        // requests.push(this._send_command({ action: 'nodes' }, "device_info"))
        // requests.push(this._send_command({ action: 'getnetworkinfo', nodeid: nodeid }, "device_info"))
        // requests.push(this._send_command({ action: 'lastconnect', nodeid: nodeid }, "device_info"))
        // requests.push(this._send_command({ action: 'getsysinfo', nodeid: nodeid, nodeinfo: true }, "device_info"))
        requests.push(this._send_command_no_response_id({ action: "nodes" }))
        requests.push(this._send_command_no_response_id({ action: 'getnetworkinfo', nodeid: nodeid }))
        requests.push(this._send_command_no_response_id({ action: 'lastconnect', nodeid: nodeid }))
        requests.push(this._send_command_no_response_id({ action: 'getsysinfo', nodeid: nodeid, nodeinfo: true }))
        return Promise.all(requests).then(([nodes, network, lastconnect, sysinfo])=>{
            let node = null
            if (sysinfo != null && (sysinfo.node != null)) {
                // Node information came with system information
                node = sysinfo.node;
            } else {
                // This device does not have system information, get node information from the nodes list.
                for (var m in nodes.nodes) {
                    for (var n in nodes.nodes[m]) {
                        if (nodes.nodes[m][n]._id.indexOf(nodeid) >= 0) { node = nodes.nodes[m][n]; }
                    }
                }
            }
            if (node == null) {
                return {"response": "failure", "message": "Invalid device id"}
            }

            if (lastconnect != null) { node.lastconnect = lastconnect.time; node.lastaddr = lastconnect.addr; }
            return sysinfo
        })
    }

    async edit_device(nodeid, {name=null, description=null, tags=null, icon=null, consent=null}={}) {
        // consent = CONSENTFLAGS
        let op = { action: 'changedevice', nodeid: nodeid };
        if (name !== null) { op.name = name }
        if (description !== null) { op.desc = description }
        if (tags !== null) { op.tags = tags }
        if (icon !== null) { op.icon = icon }
        if (consent !== null) { op.consent = consent }
        return this._send_command(op, "edit_device")
    }

    async run_command(nodeids, command, {powershell=false, runasuser=false, runasuseronly=false}={}) {
        let runAsUser = 0;
        if (runasuser) { runAsUser = 1; } else if (runasuseronly) { runAsUser = 2; }
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        return this._send_command({ action: 'runcommands', nodeids: nodeids, type: (powershell ? 2 : 0), cmds: command, runAsUser: runAsUser }, "run_command")
    }

    async shell(nodeid) {
        return await _Shell.create(this, nodeid)
    }

    async smart_shell(nodeid, regex) {
        let shell = await this.shell()
        return await _SmartShell.create(shell, regex)
    }

    async wake_devices(nodeids) {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        return this._send_command({ action: 'wakedevices', nodeids: nodeids }, "wake_devices")
    }

    async reset_devices(nodeids) {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        return this._send_command({ action: 'poweraction', nodeids: nodeids, actiontype: 3 }, "reset_devices")
    }

    async sleep_devices(nodeids) {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        return this._send_command({ action: 'poweraction', nodeids: nodeids, actiontype: 4 }, "sleep_devices")
    }

    async power_off_devices(nodeids) {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        return this._send_command({ action: 'poweraction', nodeids: nodeids, actiontype: 2 }, "power_off_devices")
    }

    async list_device_shares(nodenodeid) {
        return this._send_command({ action: 'deviceShares', nodeid: nodeid }, "list_device_shares")
    }

    async add_device_share(nodeid, name, {type=SHARINGTYPE.desktop, consent=null, start=null, end=null, duration=60*60}={}) {
        if (start === null) {
            start = new Date()
        }
        if (consent === null) {
            if (type === SHARINGTYPE.desktop) {
                consent = CONSENTFLAGS.desktopnotify
            } else {
                consent = CONSENTFLAGS.terminalnotify
            }
        }
        start = Math.floor(start/1000)
        if (end === null) {
            end = start + duration
        } else {
            end = Math.floor(args.end/1000)
        }
        if (end <= start) {
            throw Error("End time must be ahead of start time")
        }
        return this._send_command({ action: 'createDeviceShareLink', nodeid: nodeid, guestname: name, p: SHARINGTYPENUM[type], consent: consent, start: start, end: end }, "add_device_share")
    }

    async remove_device_share(nodeid, shareid) {
        return this._send_command({ action: 'removeDeviceShare', nodeid: nodeid, publicid: shareid }, "remove_device_share")
    }

    async device_open_url(nodeid, url) {
        return this._send_command({ action: 'msg', type: 'openUrl', nodeid: nodeid, url: url }, "device_open_url")
    }

    async device_message(nodeid, message, {title="MeshCentral"}={}) {
        return this._send_command({ action: 'msg', type: 'messagebox', nodeid: nodeid, title: title, msg: message }, "device_message")
    }

    async device_toast(nodeids, message, {title="MeshCentral"}={}) {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        return this._send_command({ action: 'toast', nodeids: nodeids, title: "MeshCentral", msg: message }, "device_toast")
    }

    // This API is fire and forget
    interuser(data, {session=null, user=null}={}) {
        if (session === null && user === null) {
            throw Error("No user or session given")
        }
        this._sock.send(JSON.stringify({action: "interuser", data: data, sessionid: session, userid: user}))
    }

    _pack_number(number, bytes, {endianness="big"}={}) {
        let buf = Buffer.alloc(bytes)
        let adder = 1
        let buf_start = 0
        let buf_end = bytes-1
        if (endianness === "big") {
            adder = -1
            buf_start = bytes-1
            buf_end = 0
        }
        for (let i = buf_start; i != buf_end+adder; i+=adder) {
            buf[i] = number&0xFF
            number >>= 8
        }
        return buf
    }

    _unpack_number(buf, {endianness="big"}={}) {
        let bytes = buf.length
        let number = 0
        let adder = 1
        let buf_start = 0
        let buf_end = bytes-1
        let multiplier = 0
        if (endianness === "big") {
            adder = -1
            buf_start = bytes-1
            buf_end = 0
        }
        for (let i = buf_start; i != buf_end+adder; i+=adder) {
            number += buf[i]<<multiplier
            multiplier += 8
        }
        return number
    }

    async receive_interuser_file(sessionid, {target=null}={}) {
        let passthrough = false
        if (target===null) {
            target = new stream.PassThrough()
            passthrough = true
        }
        let file_id = this._get_command_id()
        await this.interuser({fileid: file_id, command: "subreceivestart"}, {session: sessionid})
        return new Promise((resolve, reject)=>{
            let bytes_received = 0
            let l = this.listen_to_events(async (event)=>{
                if (data.slice(0, 6) == "fileid") {
                    if (this._unpack_number(data.slice(6, 10)) !== file_id) {
                        return
                    }
                }
                let wdata = data.slice(12)
                if (data[11] === 0) {
                    bytes_received += wdata.length
                    target.end(wdata)
                    this.interuser(JSON.stringify({fileid: file_id, command: "subreceiveend"}), {session: sessionid})
                    resolve({"bytes": bytes_received, "stream": target})
                    this.stop_listening_to_events(l)
                    return
                }
                bytes_received += wdata.length
                target.write(wdata)
                this.interuser(JSON.stringify({fileid: file_id, command: "subreceiveack"}), {session: sessionid})
            }, {"action": "interuser"})
        })
    }

    async send_interuser_file(sessionid, source) {
        let outstream = new _SizeChunker(65564)
        let file_id
        let upload_queue = [new _Deferred()]
        let first = true
        return new Promise((resolve, reject)=>{
            let l = this.listen_to_event(async (event)=>{
                try {
                    data = JSON.parse(event.data)
                } catch (err) {
                    return
                }
                if (data.command === "subreceivestart") {
                    file_id = data.fileid
                    outstream.on("data", (data)=>{
                        data = Buffer.concat([Buffer.from([1]), data])
                        upload_queue.at(-1).then(()=>{
                            this.interuser(Buffer.concat([Buffer.from("fileid"), this._pack_number(file_id, 4), data]), {session: sessionid})
                        })
                        upload_queue.push(new _Deferred())
                        if (first) {
                            first = false
                            upload_queue.shift().resolve()
                        }
                    })
                    outstream.on("end", ()=>{
                        upload_queue.at(-1).then(()=>{
                            this.interuser(Buffer.concat([Buffer.from("fileid"), this._pack_number(file_id, 4), Buffer.from([0])]), {session: sessionid})
                        })
                    })
                    source.pipe(outstream)
                }
                else if (data.command === "subreceiveack") {
                    upload_queue.shift().resolve()
                }
                else if (data.command === "subreceiveend") {
                    this.stop_listening_to_events(l)
                    resolve()
                }
            }, {"action": "interuser"})
        })
    }

    async upload(nodeid, source, target) {
        let files = await this.file_explorer(nodeid)
        return files.upload(source, target)
    }

    async upload_file(nodeid, filename, target) {
        f = fs.createReadStream(filename)
        return this.upload(nodeid, f, target)
    }

    async download(nodeid, source, {target=null}={}) {
        let passthrough = false
        if (target===null) {
            target = new stream.PassThrough()
            passthrough = true
        }
        let files = await this.file_explorer(nodeid)
        return files.download(source, target).then(()=>{
            return target
        }, (err)=>{
            throw Error(`${err.result}: ${err.size} bytes downloaded`)
        })
    }

    async download_file(nodeid, source, filename) {
        let f = fs.createWriteStream(filename)
        return this.download(nodeid, source, {target: f})
    }

    async file_explorer(nodeid) {
        return await _Files.create(this, nodeid)
    }

    _checkAmtPassword(p) { return (p.length > 7) && (/\d/.test(p)) && (/[a-z]/.test(p)) && (/[A-Z]/.test(p)) && (/\W/.test(p)); }
    _getRandomAmtPassword() { var p; do { p = Buffer.from(crypto.randomBytes(9), 'binary').toString('base64').split('/').join('@'); } while (this._checkAmtPassword(p) == false); return p; }
    _getRandomHex(count) { return Buffer.from(crypto.randomBytes(count), 'binary').toString('hex'); }

}

class _SmartShell {
    constructor(shell, regex) {
        this._shell = shell
        this._regex = regex
        // This comes twice. Test this for sanity
        this._shell.expect(this._regex).then((data)=>{
            this._shell.expect(this._regex)
        })
    }

    async send_command(command) {
        if (!command.endsWith("\n")) {
            command += "\n"
        }
        this._shell.write(command)
        return this._shell.expect(this._regex).then((data)=>{
            let m = data.toString().match(this._regex)
            return data.slice(0, m.index)
        })
    }

    close() {
        this._shell.close()
    }
}

const PROTOCOL = _make_enum(["terminal", "", "", "", "files"], {start_value: 0x1})

class _Tunnel {
    
    constructor(session, node_id, protocol) {
        this._session = session
        this.node_id = node_id
        this._protocol = protocol
        this._tunnel_id = null
        this._eventer = new EventEmitter()
        this.url = null
        this._socket_open = new _Deferred()
        this.initialized = new _Deferred()
    }

    static async create(...args) {
        let t = new this(...args)
        await t.initialized
        return t
    }

    _on_verify_server(clientName, certs) { return null; }

    _initialize() {
        this._session._send_command_no_response_id({ "action":"authcookie" }).then((data)=>{
            // if ((settings.cmd == 'upload') || (settings.cmd == 'download')) { protocol = 5; } // Files
            if ((this.node_id.split('/') != 3) && (this._session._currentDomain != null)) { this.node_id = 'node/' + this._session._currentDomain + '/' + this.node_id; }
            this._tunnel_id = this._session._getRandomHex(6);
            this._session._send_command({ action: 'msg', nodeid: this.node_id, type: 'tunnel', usage: 1, value: '*/meshrelay.ashx?p=' + this._protocol + '&nodeid=' + this.node_id + '&id=' + this._tunnel_id + '&rauth=' + data.rcookie }, "initialize_shell").then((data2)=>{
                if (data2.result !== "OK") {
                    this._socket_open.reject(data2)
                    this.initialized.reject(data2)
                    return
                }
                this.url = this._session.url.replace('/control.ashx', '/meshrelay.ashx?browser=1&p=' + this._protocol + '&nodeid=' + this.node_id + '&id=' + this._tunnel_id + '&auth=' + data.cookie)

                let options = { rejectUnauthorized: false, checkServerIdentity: this._on_verify_server }

                // Setup the HTTP proxy if needed
                if (this._session._proxy != null) {
                    options.agent = new https_proxy_agent(urllib.parse(this._session._proxy))
                }

                this._sock = new ws(this.url, options)

                this._sock.on("open", () => {
                    this._socket_open.resolve()
                })
                this._sock.on('close', (arg, arg2) => {
                });
                this._sock.on('error', (err) => {
                    this._socket_open.reject(err.code)
                });
                this._sock.on('message', this._receive_message.bind(this))
            })
        })
    }

    _receive_message(raw_data) {
        throw Error("Receive message unimplemented")
    }
}

class _SizeChunker extends stream.Transform {
    constructor(size, options) {
        super(options)
        this.chunksize = size
        this._buffer = Buffer.alloc(0)
    }

    _transform(chunk, encoding, callback) {
        this._buffer = Buffer.concat([this._buffer, chunk])
        let chunk_start = 0
        let chunks = []
        while (chunk_start + this.chunksize < this._buffer.length) {
            let chunk = this._buffer.slice(chunk_start, chunk_start+this.chunksize)
            this.push(chunk)
            chunk_start += this.chunksize
        }
        this._buffer = this._buffer.slice(chunk_start)
        callback()
    }

    _flush(callback) {
        this.push(this._buffer)
        callback()
    }
}

class _Files extends _Tunnel {
    constructor(session, node_id) {
        super(session, node_id, PROTOCOL.files)
        this.recorded = null
        this._request_id = 0
        this._requests = {}
        this._request_queue = []
        this._download_finished = new _Deferred()
        this._download_finished.resolve()

        this._initialize()
    }

    _get_request_id(){
        this._request_id = this._request_id++%(2**32-1)
        return this._request_id
    }

    async _send_command(data, name) {
        let id = `meshctrl_${name}_${this._get_request_id()}`
        let f, f2
        let p = new Promise((resolve, reject)=>{
            f = (...args) =>{
                resolve(...args)
            }
            f2 = (...args) =>{
                reject(...args)
            }
        })
        this._requests[id] = {id: id, type: name, resolve: f, reject: f2}
        this._request_queue.push(this._requests[id])
        let r = ()=>{
            this._sock.send(JSON.stringify(Object.assign({}, data, { responseid: id })))
            return p
        }
        return this._download_finished = this._download_finished.then(r, r)
        
    }

    async ls(directory) {
        return this.initialized.then(()=>{
            return this._send_command({action: "ls", path: directory}, "ls")
        })
    }

    async mkdir(directory) {
        return this.initialized.then(()=>{
            return this._send_command({action: "mkdir", path: directory}, "mkdir")
        })
    }

    async rm(files, {recursive=false}={}) {
        if (typeof(files) === "string") { files = [files] }
        return this.initialized.then(()=>{
            return this._send_command({action: "mkdir", delfiles: files, rec: recursive}, "mkdir")
        })
    }

    async rename(path, name, new_name) {
        return this.initialized.then(()=>{
            return this._send_command({action: "rename", path: path, oldname: oldname, newname: new_name}, "rename")
        })
    }

    async find(filter, {path="/"}={}) {
        return this.initialized.then(()=>{
            return this._send_command({action: "findfile", path: path, filter: filter}, "find")
        })
    }

    //This is in the api, not sure what it's for, so I implemented it directly
    async cancelfindfile() {
        return this.initialized.then(()=>{
            return this._send_command({action: "cancelfindfile"}, "cancelfindfile")
        })
    }

    async get_hash(path, {name=null}={}) {
        return this.initialized.then(()=>{
            return this._send_command({action: "uploadhash", path: path, name: name}, "get_hash")
        })
    }

    async copy(source, destination, names) {
        if (typeof(names) === "string") { names = [names] }
        return this.initialized.then(()=>{
            return this._send_command({action: "copy", scpath: source, dspath: destination, names: names}, "copy")
        })
    }

    async zip(path, files, output) {
        if (typeof(files) === "string") { files = [files] }
        return this.initialized.then(()=>{
            return this._send_command({action: "zip", path: path, files: files, output: output}, "zip")
        })
    }

    async upload(source, target, {name=null}={}) {
        return this.initialized.then(()=>{
            if (source.readableEnded) {
                throw Error("Cannot upload from ended readable")
            }
            let request_id = `upload_${this._get_request_id()}`
            let outstream = new _SizeChunker(65564)
            this._requests[request_id] = {id: request_id, type: "upload", source: source, chunker: outstream, target: target, name: name, size: 0, chunks: [], complete: false, has_data: new _Deferred(), inflight: 0}
            // outstream.on("data", (data) => {
            //     console.log("Read a chunk")
            //     this._requests[request_id].chunks.push(data)
            //     console.log(this._requests[request_id].chunks)
            //     this._requests[request_id].has_data.resolve()
            //     this._requests[request_id].has_data = new _Deferred()
            // })
            // outstream.on("end",() => {
            //     console.log("Ended")
            //     this._requests[request_id].has_data.resolve()
            //     this._requests[request_id].complete = true
            // })
            // source.pipe(outstream)
            this._request_queue.push(this._requests[request_id])
            let f = ()=>{
                return new Promise((resolve, reject)=>{
                    this._sock.send(JSON.stringify({ action: 'upload', reqid: request_id, path: target, name: name}))
                    this._eventer.once(request_id, (data)=>{
                        delete this._requests[this._request_queue.shift().id]
                        if (data.result == "success") {
                            resolve(data)
                        } else {
                            reject(data)
                        }
                    })
                })
            }
            this._download_finished = this._download_finished.then(f, f)
            return this._download_finished
        })
    }

    async download(source, target) {
        return this.initialized.then(()=>{
            let request_id = `download_${this._get_request_id()}`
            this._requests[request_id] = {id: request_id, type: "download", source: source, target: target, size: 0}
            this._request_queue.push(this._requests[request_id])
            let f = ()=>{
                return new Promise((resolve, reject)=>{
                    this._sock.send(JSON.stringify({ action: 'download', sub: 'start', id: request_id, path: source }))
                    this._eventer.once(request_id, (data)=>{
                        delete this._requests[this._request_queue.shift().id]
                        if (data.result == "success") {
                            resolve(data)
                        } else {
                            reject(data)
                        }
                    })
                })
            }
            this._download_finished = this._download_finished.then(f, f)
            return this._download_finished
        })
    }

    _handle_upload(raw_data, req) {
        var cmd = null;
        try { cmd = JSON.parse(raw_data.toString()); } catch (ex) { return; }
        if (cmd.reqid == req.id) {
            if (cmd.action == "uploaddone") {
                this._eventer.emit(req.id, {result: "success", size: req.size})
            } else if (cmd.action === "uploadstart") {
                req.chunker.on("data", (new_buf) => {
                    let buf = Buffer.alloc(65565)
                    let len = new_buf.length
                    var start = 1;
                    new_buf.copy(buf, start)
                    if (len > 0) {
                        req.size += len
                        if ((buf[1] == 0) || (buf[1] == 123)) { start = 0; buf[0] = 0; len++; } // If the buffer starts with 0 or 123, we must add an extra 0 at the start of the buffer
                        this._sock.send(buf.slice(start, start + len))
                        req.inflight++
                    }
                })
                req.chunker.on("end", ()=>{
                    req.complete = true
                    if (req.inflight == 0) {
                        this._sock.send(JSON.stringify({ action: 'uploaddone', reqid: req.id}))
                    }
                })
                req.source.pipe(req.chunker)
            } else if (cmd.action === "uploadack") {
                req.inflight--
                if (req.complete && req.inflight == 0) {
                    this._sock.send(JSON.stringify({ action: 'uploaddone', reqid: req.id}))
                }
            } else if (cmd.action == 'uploaderror') {
                this._eventer.emit(req.id, {result: "error", size: req.size})
            }
        }
    }

    _handle_download(raw_data, req) {
        let cmd = null
        try {
            cmd = JSON.parse(raw_data.toString());
        } catch (err) { }
        if (cmd === null) {
            if (raw_data.length > 4) {
                req.target.write(raw_data.slice(4))
                req.size += raw_data.length-4
            }
            if ((raw_data[3] & 1) != 0) { // Check end flag
                req.target.end()
                this._eventer.emit(req.id, {result: "success", size: req.size})
            } else {
               this._sock.send(JSON.stringify({ action: 'download', sub: 'ack', id: req.id })) // Send the ACK
            }
        } else {
            if (cmd.action == 'download') {
                if (cmd.id != req.id) return;
                if (cmd.sub == 'start') {
                    this._sock.send(JSON.stringify({ action: 'download', sub: 'startack', id: req.id }))
                } else if (cmd.sub == 'cancel') {
                    req.target.end()
                    this._eventer.emit(req.id, {result: "canceled", size: req.size})
                }
            }
        }
    }

    _handle_action(raw_data) {
        var data = null;
        data = JSON.parse(raw_data)
        let req = this._request_queue.shift()
        delete this._requests[req.id]
        req.resolve(data)
    }

    _receive_message(raw_data) {
        var data = raw_data.toString();
        if (this.initialized.resolved) {
            if (raw_data[0] === 123 && !["upload", "download"].includes(this._request_queue[0].type)) {
                this._handle_action(raw_data)
            }
            else if (this._request_queue.length && this._request_queue[0].type === "upload") {
                this._handle_upload(raw_data, this._request_queue[0])
            } else if (this._request_queue.length && this._request_queue[0].type === "download") {
                this._handle_download(raw_data, this._request_queue[0])
            }
        } else {
            this.recorded = false
            if (data == "cr") {
                this.recorded = true
            }
            this._sock.send(Buffer.from(`${this._protocol}`))
            this.initialized.resolve()
        }
    }
}

class _Shell extends _Tunnel {
    constructor(session, node_id) {
        this.recorded = null
        this._buffer = Buffer.alloc(0)
        this._message_queue = []
        this._command_id = 0
        super(session, node_id, PROTOCOL.terminal)

        this._initialize()
    }

    async write(command) {
        return this._sock.send(Buffer.from(command))
    }

    async read(length=null, timeout=null, return_intermediate=false) {
        let start = new Date()
        return new Promise((resolve, reject)=>{
            let check_data = ()=>{
                if (timeout !== null && new Date() - start > timeout) {
                    let obj = {reason: "timeout"}
                    if (return_intermediate) {
                        obj["data"] = this._buffer.slice(0, length)
                        this._buffer = this._buffer.slice(length)
                    }
                    reject(obj)
                } else if (length !== null && this._buffer.length < length) {
                    setTimeout(()=>{
                        check_data()
                    }, 100)
                } else {
                    if (length !== null) {
                        let data = this._buffer.slice(0, length)
                        this._buffer = this._buffer.slice(length)
                        resolve(data)
                    } else {
                        let data = this._buffer.slice()
                        this._buffer = Buffer.alloc(0)
                        resolve(data)
                    }
                }
            }
            check_data()
        })
    }

    async expect(regex, timeout=null, return_intermediate=false) {
        let data = Buffer.alloc(0),
            start = new Date()

        return new Promise((resolve, reject)=>{
            let check_data = ()=>{
                if (timeout !== null && new Date() - start > timeout) {
                    let obj = {reason: "timeout"}
                    if (return_intermediate) {
                        this.read(1024, 100, true).then((data)=>{
                            obj["data"] = data
                            reject(obj)
                        }, (({reason, data})=>{
                            obj["data"] = data
                            reject(obj)
                        }))
                    } else {
                        reject(obj)
                    }
                } else {
                    let m = this._buffer.toString().match(regex)
                    if (m !== null) {
                        this.read(m.index+m[0].length).then((data)=>{
                            resolve(data)
                        })
                    } else {
                        setTimeout(()=>{
                            check_data()
                        }, 100)
                    }
                }
            }
            check_data()
        })
    }

    close() {
        this._sock.close()
    }

    _receive_message(raw_data){
        var data = raw_data.toString();
        if (this.initialized.resolved) {
            // If the incoming text looks exactly like a control command, ignore it.
            if ((typeof data == 'string') && (data.startsWith('{"ctrlChannel":"102938","type":"'))) {
                var ctrlCmd = null;
                try { ctrlCmd = JSON.parse(data); } catch (ex) { }
                if ((ctrlCmd != null) && (ctrlCmd.ctrlChannel == '102938') && (ctrlCmd.type != null)) return; // This is a control command, like ping/pong. Ignore it.
            }
            this._buffer = Buffer.concat([this._buffer, Buffer.from(data)])
        } else {
            this.recorded = false
            if (data == "cr") {
                this.recorded = true
            }
            this.write(`${this._protocol}`); // Terminal
            this.initialized.resolve()
        }
    }
}

let _Internal = {
    _SizeChunker,
    _Shell,
    _SmartShell,
    _Tunnel,
    _Deferred,
    _compare_obj,
    _make_enum,
    _make_bitwise_enum
}

export {Session as default, Session, MESHRIGHTS, USERRIGHTS, CONSENTFLAGS, SHARINGTYPE, SHARINGTYPENUM, PROTOCOL, _Internal}