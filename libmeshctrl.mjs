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
import _ from "lodash"

"use strict"

/**
 * Simple deferred class to wrap a promise, so it's readable from outside. This makes certain synchronization easier. Usable like a promise.
 * @class
 * @prop {boolean} resolved - Whether the promise has resolved
 * @prop {boolean} rejected - Whether the promise has rejected
 */
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
        this.catch = this.promise.catch.bind(this.promise)
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

/** Represents an error thrown from the server
 * @extends Error
 */
class ServerError extends Error {
    constructor(message) {
        super(message)
    }
}

/** Represents an error in the user given input
 * @extends Error
 */
class ValueError extends Error {
    constructor(message) {
        super(message)
    }
}

/**
 * @readonly
 * @enum {number} - Bitwise flags for user rights
 * @prop {number} norights - User has no rights
 * @prop {number} backup - 
 * @prop {number} manageusers - User can add or remove users
 * @prop {number} restore - 
 * @prop {number} fileaccess - 
 * @prop {number} update - 
 * @prop {number} locked - 
 * @prop {number} nonewgroups - 
 * @prop {number} notools - 
 * @prop {number} usergroups - 
 * @prop {number} recordings -
 * @prop {number} locksettings -
 * @prop {number} allevents -
 * @prop {number} fullrights - User has all rights above
 */
const USERRIGHTS = _make_bitwise_enum(['backup', 'manageusers', 'restore', 'fileaccess', 'update', 'locked', 'nonewgroups', 'notools', 'usergroups', 'recordings', 'locksettings', 'allevents'], {all_prop:"fullrights", none_prop: "norights"})

/**
 * @readonly
 * @enum {number} - Bitwise flags for mesh rights
 * @prop {number} norights - User has no rights
 * @prop {number} editgroup - The right to edit the group
 * @prop {number} manageusers - Right to manage users
 * @prop {number} managedevices - Right to add/remove/rename devices
 * @prop {number} remotecontrol - Remotely control nodes
 * @prop {number} agentconsole - Access to the agent console
 * @prop {number} serverfiles - 
 * @prop {number} wakedevices - Wake up devices from sleep
 * @prop {number} notes - 
 * @prop {number} desktopviewonly - Only view desktop; no control
 * @prop {number} noterminal - Disable terminal
 * @prop {number} nofiles - Disable file handling
 * @prop {number} noamt -
 * @prop {number} limiteddesktop -
 * @prop {number} limitedevents -
 * @prop {number} chatnotify -
 * @prop {number} uninstall -
 * @prop {number} noremotedesktop - Disable remote desktop
 * @prop {number} remotecommands - Right to send commands to device
 * @prop {number} resetpoweroff - Right to reset or power off node
 * @prop {number} fullrights - User has all rights above
 */
const MESHRIGHTS = _make_bitwise_enum(["editgroup", "manageusers", "managedevices", "remotecontrol", "agentconsole", "serverfiles", "wakedevices", "notes", "desktopviewonly", "noterminal", "nofiles", "noamt", "limiteddesktop", "limitedevents", "chatnotify", "uninstall", "noremotedesktop", "remotecommands", "resetpoweroff"], {all_prop:"fullrights", none_prop: "norights"})

/**
 * @readonly
 * @enum {number} - Bitwise flags for 
 * @prop {number} none - Use no flags
 * @prop {number} desktopnotify - 
 * @prop {number} terminalnotify - 
 * @prop {number} filesnotify - 
 * @prop {number} desktopprompt - 
 * @prop {number} terminalprompt - 
 * @prop {number} filesprompt - 
 * @prop {number} desktopprivacybar - 
 * @prop {number} all - Use all flags
 */
const CONSENTFLAGS = _make_bitwise_enum(["desktopnotify", "terminalnotify", "filesnotify", "desktopprompt", "terminalprompt", "filesprompt", "desktopprivacybar"], {all_prop:"all", none_prop: "none"})

/**
 * @readonly
 * @enum {number} - Bitwise flags for features to be used in meshes
 * @prop {number} none - Use no flags
 * @prop {number} autoremove - 
 * @prop {number} hostnamesync - 
 * @prop {number} recordsessions - Allow recording of sessions
 * @prop {number} all - Use all flags
 */
const MESHFEATURES = _make_bitwise_enum(["autoremove", "hostnamesync", "recordsessions"], {all_prop:"all", none_prop: "none"})

/**
 * @readonly
 * @enum {string} - String constants used to determine which type of device share to create
 * @prop {string} desktop
 * @prop {string} terminal
 */
const SHARINGTYPE = _make_enum(["desktop", "terminal"], {use_string: true})

/**
 * @readonly
 * @enum {number} - Internal enum used to map SHARINGTYPE to the number used by MeshCentral
 * @prop {number} desktop
 * @prop {number} terminal
 */
const SHARINGTYPENUM = _make_enum(["desktop", "terminal"], {start_value: 0x1})

/**
 * @readonly
 * @enum {number} - Which icon to use for a device
 * @prop {number} desktop
 * @prop {number} latop
 * @prop {number} phone
 * @prop {number} server
 * @prop {number} htpc
 * @prop {number} router
 * @prop {number} embedded
 * @prop {number} virtual
 */
const ICON = _make_enum(["desktop", "latop", "phone", "server", "htpc", "router", "embedded", "virtual"], {start_value: 0x1})

/** Class for MeshCentral Session 
 * @prop {_Deferred} initialized - Promise which is resolved when session is initialized, and rejected upon failure
 * @prop {bool} alive - Whether the session is currently alive*/
class Session {
    /**
     * Constructor for Session
     * @param {string} url - URL of meshcentral server to connect to. Should start with either "ws://" or "wss://".
     * @param {Object} [options={}] - Optional arguments for instantiation
     * @param {string} [options.user=null] - Username of to use for connecting. Can also be username generated from token.
     * @param {string} [options.domain=null] - Domain to connect to
     * @param {string} [options.password=null] - Password with which to connect. Can also be password generated from token.
     * @param {string} [options.loginkey=null] - Key from already handled login. Overrides username/password.
     * @param {string} [options.proxy=null] - "url:port" to use for proxy server
     * @param {string} [options.token=null] - Login token. This appears to be superfluous
     * @returns {Session} Instance of Session
     */
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

    /**
     * Factory for Session
     * @param {string} url - URL of meshcentral server to connect to. Should start with either "ws://" or "wss://".
     * @param {Object} [options={}] - Optional arguments for instantiation
     * @param {string} [options.user=null] - Username of to use for connecting. Can also be username generated from token.
     * @param {string} [options.domain=null] - Domain to connect to
     * @param {string} [options.password=null] - Password with which to connect. Can also be password generated from token.
     * @param {string} [options.loginkey=null] - Key from already handled login. Overrides username/password.
     * @param {string} [options.proxy=null] - "url:port" to use for proxy server
     * @param {string} [options.token=null] - Login token. This appears to be superfluous
     * @returns {Session} Instance of Session which has been initialized
     */
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
        var data = null;
        data = JSON.parse(raw_data)
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
        if (data.responseid || data.tag) {
            this._eventer.emit(data.responseid || data.tag, data)
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

    /**
     * Close Session
     */
    close() {
        this._sock.close()
    }

    /**
     * Get server information
     * @return {Promise<Object>} Server info
     */
    async server_info() {
        return this._server_info
    }

    /**
     * Get user information
     * @return {Promise<Object>} User info
     */
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
        this._sock.send(JSON.stringify(Object.assign({}, data, { tag: id, responseid: id })))
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

    /** 
     * Send an invite email for a group or mesh
     * @param {string} group - Name of mesh to which to invite email
     * @param {string} email - Email of user to invite
     * @param {Object} [options={}]
     * @param {string} [options.name=null] - User's name. For display purposes.
     * @param {string} [options.message=null] - Message to send to user in invite email
     * @param {string} [options.meshid=null] - ID of mesh which to invite user. Overrides "group"
     * @return {Promise<Boolean>} true on success
     * @throws {ServerError} Error text from server if there is a failure
     */
    async send_invite_email(group, email, {name=null, message=null, meshid=null}={}){
        var op = { action: 'inviteAgent', email: email, name: '', os: '0' }
        if (meshid) { op.meshid = meshid } else if (group) { op.meshname = group }
        if (name) { op.name = name }
        if (message) { op.msg = message }
        return this._send_command(op, "send_invite_email").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** 
     * Generate an invite link for a group or mesh
     * @param {string} group - Name of group to add
     * @param {number} hours - Hours until link expires
     * @param {Object} [options={}]
     * @param {MESHRIGHTS} [options.flags=null] - Bitwise flags for MESHRIGHTS
     * @param {string} [options.meshid=null] - ID of mesh which to invite user. Overrides "group"
     * @return {Promise<Object>} Invite link information
     * @throws {ServerError} Error text from server if there is a failure
     */
    async generate_invite_link(group, hours, {flags=null, meshid=null}={}) {
        var op = { action: 'createInviteLink', expire: hours, flags: 0 }
        if (meshid) { op.meshid = meshid; } else if (group) { op.meshname = group; }
        if (flags !== null) { op.flags = flags; }
        return this._send_command(op, "generate_invite_link").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            delete data.tag
            delete data.responseid
            delete data.action
            return data
        })
    }

    /**
     * List users on server. Admin Only.
     * @returns {Promise<Object[]>} List of users
     * @throws {ServerError} Error text from server if there is a failure
     */
    async list_users() {
        return this._send_command({action: "users"}, "list_users").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return data.users
        })
    }

    /**
     * Get list of connected users. Admin Only.
     * @returns {Promise<Object[]>} List of user sessions
     */
    async list_user_sessions() {
        return this._send_command({action: "wssessioncount"}, "list_user_sessions").then((data)=>{
            return data.wssessions
        })
    }

    /**
     * Get user groups. Admin will get all user groups, otherwise get limited user groups
     * @returns {Promise<Object[]|null>} List of groups, or null if no groups are found
     */
    async list_user_groups() {
        return this._send_command({action: "usergroups"}, "list_user_groups").then((data)=>{
            return data.ugroups
        })
    }

    /**
     * Get device groups. Only returns meshes to which the logged in user has access
     * @returns {Promise<Object[]>} List of meshes
     */
    async list_device_groups() {
        return this._send_command({action: "meshes"}, "list_device_groups").then((data)=>{
            return data.meshes
        })
    }

    /**
     * Get devices to which the user has access.
     * @param {Object} [options={}]
     * @param {boolean} [options.details=false] - Get device details
     * @param {string} [options.group=null] - Get devices from specific group by name. Overrides meshid
     * @param {string} [options.meshid=null] - Get devices from specific group by id
     * @returns {Promise<Object[]>} List of nodes
     */
    async list_devices({details=false, group=null, meshid=null}={}) {
        let command_list = []
        if (details) {
            command_list.push(this._send_command({action: "getDeviceDetails", type:"json"}, "list_devices"))
        } else if (group) {
            command_list.push(this._send_command({ action: 'nodes', meshname: group}, "list_devices"))
        } else if (meshid) {
            command_list.push(this._send_command({ action: 'nodes', meshid: meshid}, "list_devices"))
        } else {
            command_list.push(this._send_command({ action: 'meshes' }, "list_devices"))
            command_list.push(this._send_command({ action: 'nodes' }, "list_devices"))
            
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

    /**
     * @callback Session~EventCallback
     * @param {Object} data - Raw event data from the server
     */

    /**
     * Listen to events from the server
     * @param {Session~EventCallback} f - Function to call when an event occurs
     * @param {Object} [filter=null] - Object to filter events with. Only trigger for events that deep-match this object. Use sets for "array.contains" and arrays for equality of lists.
     * @return {function} - Function used for listening. Use this to stop listening to events if you want that.
     */
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

    /**
     * Stop listening to server events
     * @param {function} Callback to stop listening with.
     */
    stop_listening_to_events(f) {
        this._eventer.off("server_event", f)
    }

    /** 
     * List events visible to the currect user
     * @param {Object} [options={}]
     * @param {string} [options.userid=null] - Filter by user. Overrides nodeid.
     * @param {string} [options.nodeid=null] - Filter by node
     * @param {number} [options.limit=null] - Limit to the N most recent events
     * @return {Promise<Object[]>} List of events
     */
    async list_events({userid=null, nodeid=null, limit=null}={}) {
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
        return this._send_command(cmd, "list_events").then((d)=>{
            return d.events
        })
    }

    /** 
     * List login tokens for current user. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.
     * @return {Promise<Object[]>} List of tokens
     */
    async list_login_tokens() {
        return this._send_command_no_response_id({ action: 'loginTokens' }).then((data)=>{
            return data.loginTokens
        })
    }

    /** 
     * Create login token for current user. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.
     * @param {string} name - Name of token
     * @param {number} [expire=null] - Minutes until expiration. 0 or null for no expiration.
     * @return {Promise<Object>} Created token
     */
    async add_login_token(name, expire=null) {
        let cmd = { action: 'createLoginToken', name: name, expire: 0 }
        if (expire) { cmd.expire = expire }
        return this._send_command_no_response_id(cmd).then((data)=>{
            let d = Object.assign({}, data)
            delete d.action
            return d
        })
        
    }

    /** 
     * Remove login token for current user. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.
     * @param {string} name - Name of token or token username
     * @return {Promise<Object[]>} List of remaining tokens
     */
    async remove_login_token(names) {
        if (typeof names === "string") {
            names = [names]
        }
        let realnames = []
        let tokens = await this.list_login_tokens()
        for (let name of names) {
            if (!name.startsWith("~")) {
                for (let token of tokens) {
                    if (token.name === name) {
                        name = token.tokenUser
                        break
                    }
                }
            }
            realnames.push(name)
        }
        return this._send_command_no_response_id({ action: 'loginTokens', remove: realnames }).then((data)=>{
            return data.loginTokens
        })
    }

    /** 
     * Add a new user
     * @param {string} name - username
     * @param {string} password - user's starting password
     * @param {Object} [options={}]
     * @param {boolean} [options.randompass=false] - Generate a random password for the user. Overrides password
     * @param {string} [options.domain=null] - Domain to which to add the user
     * @param {string} [options.email=null] - User's email address
     * @param {boolean} [options.emailverified=false] - Pre-verify the user's email address
     * @param {boolean} [options.resetpass=false] - Force the user to reset their password on first login
     * @param {string} [options.realname=null] - User's real name
     * @param {string} [options.phone=null] - User's phone number
     * @param {USERRIGHTS} [options.rights=null] - Bitwise mask of user's rights on the server
     * @return {Promise<Boolean>} true on success
     * @throws {ServerError} Error text from server if there is a failure
     */
    async add_user(name, password, {randompass=false, domain=null, email=null, emailverified=false, resetpass=false, realname=null, phone=null, rights=null}={}) {
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
        return this._send_command(op, "add_user").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** 
     * Edit an existing user
     * @param {string} userid - Unique userid
     * @param {Object} [options={}]
     * @param {string} [options.domain=null] - Domain to which to add the user
     * @param {string} [options.email=null] - User's email address
     * @param {boolean} [options.emailverified=false] - Verify or unverify the user's email address
     * @param {boolean} [options.resetpass=false] - Force the user to reset their password on next login
     * @param {string} [options.realname=null] - User's real name
     * @param {string} [options.phone=null] - User's phone number
     * @param {USERRIGHTS} [options.rights=null] - Bitwise mask of user's rights on the server
     * @return {Promise<Boolean>} true on success
     * @throws {ServerError} Error text from server if there is a failure
     */
    async edit_user(userid, {domain=null, email=null, emailverified=false, resetpass=false, realname=null, phone=null, rights=null}) {
        // Rights uses USERRIGHTS
        if ((domain != null) && (userid.indexOf('/') < 0)) { userid = 'user/' + domain + '/' + userid; }
        else if ((this._domain != null) && (userid.indexOf('/') < 0)) { userid = 'user/' + this._domain + '/' + userid; }
        let op = { action: 'edituser', userid: userid};
        if (email !== null) { op.email = email; if (emailverified) { op.emailVerified = true; } }
        if (resetpass) { op.resetNextLogin = true; }
        if (rights !== null) { op.siteadmin = rights; }
        if (domain) { op.domain = domain; }
        else if (this._domain) { op.domain = this._domain }
        if (phone === true) { op.phone = ''; }
        if (typeof phone == 'string') { op.phone = phone; }
        if (typeof realname == 'string') { op.realname = realname; }
        if (realname === true) { op.realname = ''; }
        return this._send_command(op, "edit_user").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** 
     * Remove an existing user
     * @param {string} userid - Unique userid
     * @return {Promise<Boolean>} true on success
     * @throws {ServerError} Error text from server if there is a failure
     */
    async remove_user(userid) {
        if ((this._domain != null) && (userid.indexOf('/') < 0)) { userid = 'user/' + this._domain + '/' + userid; }
        return this._send_command({ action: 'deleteuser', userid: userid }, "remove_user").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** 
     * Create a new user group
     * @param {string} name - Name of usergroup
     * @param {string} [description=null] - Description of user group
     * @return {Promise<Object>} New user group
     * @throws {ServerError} Error text from server if there is a failure
     */
    async add_user_group(name, description=null) {
        let op = { action: 'createusergroup', name: name, desc: description };
        if (this._domain) { op.domain = this._domain }
        return this._send_command(op, "add_user_group").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            delete data.action
            delete data.responseid
            delete data.result
            return data
        })
    }

    /** 
     * Remove an existing user group
     * @param {string} userid - Unique userid
     * @return {Promise<Boolean>} true on success
     * @throws {ServerError} Error text from server if there is a failure
     */
    async remove_user_group(groupid) {
        if ((this._domain != null) && (userid.indexOf('/') < 0)) { groupid = 'ugrp/' + this._domain + '/' + groupid; }
        if (!groupid.startsWith("ugrp/")) {
            groupid = `ugrp//${groupid}`
        }
        return this._send_command({ action: 'deleteusergroup', ugrpid: groupid }, "remove_user_group").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** 
     * Add user(s) to an existing user group. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.
     * @param {string|array} ids - Unique user id(s)
     * @param {string} groupid - Group to add the given user to
     * @return {Promise<string[]>} List of users that were successfully added
     * @throws {ServerError} Error text from server if there is a failure
     */
    async add_users_to_user_group(userids, groupid) {
        if (typeof userids === "string") {
            userids = [userids]
        }
        if ((this._domain != null) && (id.indexOf('/') < 0)) { groupid = 'ugrp/' + this._domain + '/' + groupid; }
        if (!groupid.startsWith("ugrp/")) {
            groupid = `ugrp//${groupid}`
        }
        return new Promise((resolve, reject)=>{
            let l = this.listen_to_events((data)=>{
                resolve(data.event.msgArgs[0])
                this.stop_listening_to_events(l)
            }, {"event": {"etype":"ugrp"}})
            this._send_command({ action: 'addusertousergroup', ugrpid: groupid, usernames: userids}, "add_users_to_user_group").then((data)=>{
                if (data.result && data.result.toLowerCase() !== "ok") {
                    reject(new ServerError(data.result))
                }

            })
        })
    }

    /** 
     * Remove user from an existing user group
     * @param {string} id - Unique user id
     * @param {string} groupid - Group to remove the given user from
     * @return {Promise<Boolean>} true on success
     * @throws {ServerError} Error text from server if there is a failure
     */
    async remove_user_from_user_group(userid, groupid) {
        if ((this._domain != null) && (id.indexOf('/') < 0)) { groupid = 'ugrp/' + this._domain + '/' + groupid; }
        if (!groupid.startsWith("ugrp/")) {
            groupid = `ugrp//${groupid}`
        }
        return this._send_command({ action: 'removeuserfromusergroup', ugrpid: groupid, userid: userid }, "remove_from_user_group").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** 
     * Add a user to an existing node
     * @param {string|array} userids - Unique user id(s)
     * @param {string} nodeid - Node to add the given user to
     * @param {MESHRIGHTS} [rights=null] - Bitwise mask for the rights on the given mesh
     * @return {Promise<Boolean>} true on success
     * @throws {ServerError} Error text from server if there is a failure
     */
    async add_users_to_device(userids, nodeid, rights=null) {
        if (typeof userids === "string") {
            userids = [userids]
        }
        userids = userids.map((u)=>u.startsWith("user//") ? u : `user//${u}`)
        rights = rights || 0
        return this._send_command({ action: 'adddeviceuser', nodeid: nodeid, userids: userids, rights: rights}, "add_users_to_device").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** 
     * Remove users from an existing node
     * @param {string} nodeid - Node to remove the given users from
     * @param {string|array} userids - Unique user id(s)
     * @return {Promise<Boolean>} true on success
     * @throws {ServerError} Error text from server if there is a failure
     */
    async remove_users_from_device(nodeid, userids) {
        if (typeof(userids) === "string") { userids = [userids] }
        userids = userids.map((u)=>u.startsWith("user//") ? u : `user//${u}`)
        return this._send_command({ action: 'adddeviceuser', nodeid: nodeid, usernames: userids, rights: 0, remove: true }, "remove_users_from_device").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** 
     * Create a new device group
     * @param {string} name - Name of device group
     * @param {Object} [options={}]
     * @param {string} [options.description=""] - Description of device group
     * @param {boolean} [options.amtonly=false] - 
     * @param {MESHFEATURES} [options.features=0] - Bitwise features to enable on the group
     * @param {CONSENTFLAGS} [options.consent=0] - Bitwise consent flags to use for the group
     * @return {Promise<Object>} New device group
     * @throws {ServerError} Error text from server if there is a failure
     */
    async add_device_group(name, {description="", amtonly=false, features=0, consent=0}={}) {
        var op = { action: 'createmesh', meshname: name, meshtype: 2 };
        if (description) { op.desc = description; }
        if (amtonly) { op.meshtype = 1 }
        if (features) { op.flags = features }
        if (consent) { op.consent = consent }
        return this._send_command(op, "add_device_group").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            delete data.result
            delete data.action
            delete data.responseid
            return data
        })
    }

    /** 
     * Remove an existing device group
     * @param {string} meshid - Unique id of device group
     * @param {boolean} [isname=false] - treat "meshid" as a name instead of an id
     * @return {Promise<Boolean>} true on success
     * @throws {ServerError} Error text from server if there is a failure
     */
    async remove_device_group(meshid, isname=false) {
        var op = { action: 'deletemesh', meshid: meshid};
        if (isname) {
            op.meshname = meshid
            delete op.meshid
        }
        return this._send_command(op, "remove_device_group").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** 
     * Edit an existing device group
     * @param {string} meshid - Unique id of device group
     * @param {Object} [options={}]
     * @param {boolean} [options.isname=false] - treat "meshid" as a name instead of an id
     * @param {string} [options.name=null] - New name for group
     * @param {boolean} [options.description=null] - New description
     * @param {MESHFEATURES} [options.flags=null] - Features to enable on the group
     * @param {CONSENTFLAGS} [options.consent=null] - Which consent flags to use for the group
     * @param {string[]} [options.invite_codes=null] - Create new invite codes
     * @param {boolean} [options.backgroundonly=false] - Flag for invite codes
     * @param {boolean} [options.interactiveonly=false] - Flag for invite codes
     * @return {Promise<Boolean>} true on success
     * @throws {ServerError} Error text from server if there is a failure
     */
    async edit_device_group(meshid, {isname=false, name=null, description=null, flags=null, consent=null, invite_codes=null, backgroundonly=false, interactiveonly=false}={}) {
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
        return this._send_command(op, "edit_device_group").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** 
     * Move a device from one group to another
     * @param {string|array} nodeids - Unique node id(s)
     * @param {string} meshid - Unique mesh id
     * @param {boolean} [isname=false] - treat "meshid" as a name instead of an id
     * @return {Promise<Boolean>} true on success
     * @throws {ServerError} Error text from server if there is a failure
     */
    async move_to_device_group(nodeids, meshid, isname=false) {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        var op = { action: 'changeDeviceMesh', nodeids: nodeids, meshid: meshid };
        if (isname) {
            op.meshname = meshid
            delete op.meshid
        }
        return this._send_command(op, "move_to_device_group").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** 
     * Add a user to an existing mesh
     * @param {string|array} userids - Unique user id(s)
     * @param {string} meshid - Mesh to add the given user to
     * @param {Object} [options={}]
     * @param {boolean} [options.isname=false] - Read meshid as a name rather than an id
     * @param {MESHRIGHTS} [options.rights=0] - Bitwise mask for the rights on the given mesh
     * @return {Promise<object>} Object showing which were added correctly and which were not, along with their result messages
     */
    async add_users_to_device_group(userids, meshid, {isname=false, rights=0}={}) {
        if (typeof userids === "string") {
            userids = [userids]
        }
        let original_ids = userids
        userids = userids.map((u)=>u.startsWith("user//") ? u : `user//${u}`)
        var op = { action: 'addmeshuser', userids: userids, meshadmin: rights, meshid: meshid };
        if (isname) {
            op.meshname = meshid
            delete op.meshid
        }
        return this._send_command(op, "add_user_to_device_group").then((data)=>{
            let results = data.result.split(",")
            let out = {}
            for (let [i, result] of results.entries()) {
                if (!i in original_ids) {
                    out["all"] = result
                } else {
                    out[original_ids[i]] = {
                        success: result.startsWith("Added user"),
                        message: result
                    }
                }
            }
            return out
        })
    }

    /** 
     * Remove users from an existing mesh
     * @param {string|array} userids - Unique user id(s)
     * @param {string} meshid - Mesh to add the given user to
     * @param {boolean} [isname=false] - Read meshid as a name rather than an id
     * @return {Promise<Object>} Object showing which were removed correctly and which were not
     */
    async remove_users_from_device_group(userids, meshid, isname=false) {
        let requests = []
        let id_obj = {meshid: meshid}
        if (isname) {
            id_obj.meshname = meshid
            delete id_obj.meshid
        }
        if (typeof(userids) === "string") { 
            userids = [userids]
        }
        for (let userid of userids) {
            requests.push(this._send_command(Object.assign({}, { action: 'removemeshuser', userid: userid }, id_obj), "remove_users_from_device_group"))
        }
        return Promise.all(requests).then((results)=>{
            let out = {}
            for (let [i, result] of results.entries()) {
                if (result.result === "ok") {
                    out[userids[i]] = {success: true}
                } else {
                    out[userids[i]] = {success: false}
                }
                out[userids[i]].message = result.result
            }
            return out
        })
    }

    /**
     * Broadcast a message to all users or a single user
     * @param {string} message - Message to broadcast
     * @param {string} [userid=null] - Optional user to which to send the message
     * @return {Promise<boolean>} True if successful
     * @throws {ServerError} Error text from server if there is a failure
     */
    async broadcast(message, userid=null) {
        var op = { action: 'userbroadcast', msg: message };
        if (userid) { op.userid = userid }
        return this._send_command(op, "broadcast").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** Get all info for a given device. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.
     * @param {string} nodeid - Unique id of desired node
     * @returns {Promise} Object containing all meaningful device info
     * @throws {ValueError} `Invalid device id` if device is not found
     */
    async device_info(nodeid) {
        let requests = []

        requests.push(this._send_command({ action: 'nodes' }, "device_info"))
        // requests.push(this._send_command_no_response_id({ action: "nodes" }))
        // requests.push(this._send_command({ action: 'getnetworkinfo', nodeid: nodeid }, "device_info"))
        requests.push(this._send_command_no_response_id({ action: 'getnetworkinfo', nodeid: nodeid }))
        // requests.push(this._send_command({ action: 'lastconnect', nodeid: nodeid }, "device_info"))
        requests.push(this._send_command_no_response_id({ action: 'lastconnect', nodeid: nodeid }))
        requests.push(this._send_command({ action: 'getsysinfo', nodeid: nodeid, nodeinfo: true }, "device_info"))
        // requests.push(this._send_command_no_response_id({ action: 'getsysinfo', nodeid: nodeid, nodeinfo: true }))
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
                throw new ValueError("Invalid device id")
            }

            if (lastconnect != null) { node.lastconnect = lastconnect.time; node.lastaddr = lastconnect.addr; }
            return sysinfo
        })
    }


    /** Edit properties of an existing device
     * @param {string} nodeid - Unique id of desired node
     * @param {Object} [options={}]
     * @param {string} [options.name=null] - New name for device
     * @param {string} [options.description=null] - New description for device
     * @param {string|string[]} [options.tags=null] - New tags for device
     * @param {ICON} [options.icon=null] - New icon for device
     * @param {CONSENTFLAGS} [options.consent=null] - New consent flags for device
     * @returns {Promise<boolean>} True if successful
     * @throws {ServerError} Error text from server if there is a failure
     */
    async edit_device(nodeid, {name=null, description=null, tags=null, icon=null, consent=null}={}) {
        let op = { action: 'changedevice', nodeid: nodeid };
        if (name !== null) { op.name = name }
        if (description !== null) { op.desc = description }
        if (tags !== null) { op.tags = tags }
        if (icon !== null) { op.icon = icon }
        if (consent !== null) { op.consent = consent }
        return this._send_command(op, "edit_device").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** Run a command on any number of nodes. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.
     * @param {string|string[]} nodeids - Unique ids of nodes on which to run the command
     * @param {string} command - Command to run
     * @param {Object} [options={}]
     * @param {boolean} [options.powershell=false] - Use powershell to run command. Only available on Windows.
     * @param {boolean} [options.runasuser=false] - Attempt to run as a user instead of the root permissions given to the agent. Fall back to root if we cannot.
     * @param {boolean} [options.runasuseronly=false] - Error if we cannot run the command as the logged in user.
     * @returns {Promise<Object>} Object containing mapped output of the commands by device
     * @throws {ServerError} Error text from server if there is a failure
     */
    async run_command(nodeids, command, {powershell=false, runasuser=false, runasuseronly=false}={}) {
        let runAsUser = 0;
        if (runasuser) { runAsUser = 1; }
        if (runasuseronly) { runAsUser = 2; }
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        let match_nodeid = (id, ids)=>{
            for (let nid of ids) {
                if (nid === id) {
                    return nid
                }
                if (nid.slice(6) === id) {
                    return nid
                }
                if (`node//${nid}` === id) {
                    return nid
                }
            }
        }
        return new Promise((resolve, reject)=>{
            let result = Object.fromEntries(nodeids.map((n)=>[n, {complete: false, result: []}]))
            let l = this.listen_to_events((data)=>{
                if (data.value === "Run commands completed.") {
                    result[match_nodeid(data.nodeid, nodeids)] = Object.assign((result[match_nodeid(data.nodeid, nodeids)] || {}), {complete: true})
                    if (_.every(Object.entries(result).map(([key, o])=>o.complete))) {
                        resolve(Object.fromEntries(Object.entries(result).map(([key, o])=>[key, o.result.join("")])))
                        this.stop_listening_to_events(l)
                    }
                } else if (data.value.startsWith("Run commands")) {
                    return
                }
                result[match_nodeid(data.nodeid, nodeids)].result.push(data.value)
            }, {action: "msg", type: "console"})
            this._send_command({ action: 'runcommands', nodeids: nodeids, type: (powershell ? 2 : 0), cmds: command, runAsUser: runAsUser }, "run_command").then((data)=>{
                if (data.result && data.result.toLowerCase() !== "ok") {
                    reject(new ServerError(data.result))
                }
            })
        })
    }

    /** Open a terminal shell on the given device
     * @param {string} nodeid - Unique id of node on which to open the shell
     * @returns {Promise<_Shell>} Newly created and initialized _Shell
     */
    async shell(nodeid) {
        return await _Shell.create(this, nodeid)
    }

    /** Open a smart terminal shell on the given device
     * @param {string} nodeid - Unique id of node on which to open the shell
     * @param {regex} regex - Regex to watch for to signify that the shell is ready for new input.
     * @returns {Promise<_SmartShell>} Newly created and initialized _SmartShell
     */
    async smart_shell(nodeid, regex) {
        let shell = await this.shell()
        return await _SmartShell.create(shell, regex)
    }

    /** Wake up given devices
     * @param {string|string[]} nodeids - Unique ids of nodes which to wake
     * @returns {Promise<boolean>} True if successful
     */
    async wake_devices(nodeids) {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        return this._send_command({ action: 'wakedevices', nodeids: nodeids }, "wake_devices").then((data)=>{

        })
    }

    /** Reset given devices
     * @param {string|string[]} nodeids - Unique ids of nodes which to reset
     * @returns {Promise<boolean>} True if successful
     */
    async reset_devices(nodeids) {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        return this._send_command({ action: 'poweraction', nodeids: nodeids, actiontype: 3 }, "reset_devices")
    }

    /** Sleep given devices
     * @param {string|string[]} nodeids - Unique ids of nodes which to sleep
     * @returns {Promise<boolean>} True if successful
     */
    async sleep_devices(nodeids) {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        return this._send_command({ action: 'poweraction', nodeids: nodeids, actiontype: 4 }, "sleep_devices")
    }

    /** Power off given devices
     * @param {string|string[]} nodeids - Unique ids of nodes which to power off
     * @returns {Promise<boolean>} True if successful
     */
    async power_off_devices(nodeids) {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        return this._send_command({ action: 'poweraction', nodeids: nodeids, actiontype: 2 }, "power_off_devices")
    }

    /** List device shares of given node. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.
     * @param {string} nodeid - Unique id of nodes of which to list shares
     * @returns {Promise<Object[]>} Array of objects representing device shares
     */
    async list_device_shares(nodeid) {
        return this._send_command_no_response_id({ action: 'deviceShares', nodeid: nodeid }).then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return data.deviceShares
        })
    }

    /** Add device share to given node. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.
     * @param {string} nodeid - Unique id of nodes of which to list shares
     * @param {string} name - Name of guest with which to share
     * @param {Object} [options={}]
     * @param {SHARINGTYPE} [options.type=SHARINGTYPE.desktop] - Type of share thise should be
     * @param {CONSENTFLAGS} [options.consent=null] - Consent flags for share. Defaults to "notify" for your given SHARINGTYPE
     * @param {number|Date} [options.start=new Date()] - When to start the share
     * @param {number|Date} [options.end=null] - When to end the share. If null, use duration instead
     * @param {number} [options.duration=60*60] - Duration in seconds for share to exist
     * @returns {Promise<Object>} Info about the newly created share
     * @throws {ServerError} Error text from server if there is a failure
     */
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
        return this._send_command({ action: 'createDeviceShareLink', nodeid: nodeid, guestname: name, p: SHARINGTYPENUM[type], consent: consent, start: start, end: end }, "add_device_share").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            delete data.action
            delete data.nodeid
            delete data.tag
            delete data.responseid
            return data
        })
    }

    /** Remove a device share
     * @param {string} nodeid - Unique node from which to remove the share
     * @param {string} shareid - Unique share id to be removed
     * @returns {Promise<boolean>} true if successful
     * @throws {ServerError} Error text from server if there is a failure
     */
    async remove_device_share(nodeid, shareid) {
        return this._send_command({ action: 'removeDeviceShare', nodeid: nodeid, publicid: shareid }, "remove_device_share").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** Open url in browser on device. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.
     * @param {string} nodeid - Unique node from which to remove the share
     * @param {string} url - url to open
     * @returns {Promise<boolean>} true if successful
     * @throws {ServerError} Error text from server if there is a failure
     * @throws {Error} `Failed to open url` if failure occurs
     */
    async device_open_url(nodeid, url) {
        return new Promise((resolve, reject)=>{
            let l = this.listen_to_events((data)=>{
                this.stop_listening_to_events(l)
                if (data.success) {
                    resolve(true)
                } else {
                    reject(new Error("Failed to open url"))
                }
            }, {type: "openUrl", url: url})
            this._send_command({ action: 'msg', type: 'openUrl', nodeid: nodeid, url: url }, "device_open_url").then((data)=>{
                if (data.result && data.result.toLowerCase() !== "ok") {
                    reject(new ServerError(data.result))
                }
            })
        })
    }

    /** Display a message on remote device.
     * @param {string} nodeid - Unique node from which to remove the share
     * @param {string} message - message to display
     * @param {string} [title="MeshCentral"] - message title
     * @returns {Promise<boolean>} true if successful
     * @throws {ServerError} Error text from server if there is a failure
     */
    async device_message(nodeid, message, title="MeshCentral") {
        return this._send_command({ action: 'msg', type: 'messagebox', nodeid: nodeid, title: title, msg: message }, "device_message").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return true
        })
    }

    /** Popup a toast a message on remote device.
     * @param {string|string[]} nodeids - Unique node from which to remove the share
     * @param {string} message - message to display
     * @param {string} [title="MeshCentral"] - message title
     * @returns {Promise<boolean>} true if successful
     * @throws {ServerError} Error text from server if there is a failure
     * @todo This function returns true even if it fails, because the server tells us it succeeds before it actually knows, then later tells us it failed, but it's hard to find taht because it looks exactly like a success.
     */
    async device_toast(nodeids, message, title="MeshCentral") {
        if (typeof(nodeids) === "string") { nodeids = [nodeids] }
        return this._send_command({ action: 'toast', nodeids: nodeids, title: "MeshCentral", msg: message }, "device_toast").then((data)=>{
            if (data.result && data.result.toLowerCase() !== "ok") {
                throw new ServerError(data.result)
            }
            return data
        })
    }

    /** Fire off an interuser message. This is a fire and forget api, we have no way of checking if the user got the message.
     * @param {serializable} data - Any sort of serializable data you want to send to the user
     * @param {Object} [options={}]
     * @param {string} [options.session=null] - Direct session to send to. Use this after you have made connection with a specific user session.
     * @param {string} [options.user=null] - Send message to all sessions of a particular user. One of these must be set.
     * @throws {ValueError} Value error if neither user nor session are given.
     */
    interuser(data, {session=null, user=null}={}) {
        if (session === null && user === null) {
            throw ValueError("No user or session given")
        }
        this._sock.send(JSON.stringify({action: "interuser", data: data, sessionid: session, userid: user}))
    }

    /** Upload a stream to a device. This creates an _File and destroys it every call. If you need to upload multiple files, use {@link Session#file_explorer} instead.
     * @param {string} nodeid - Unique id to upload stream to
     * @param {ReadableStream} source - ReadableStream from which to read data
     * @param {string} target - Path which to upload stream to on remote device
     * @returns {Promise<Object>} - {result: bool whether upload succeeded, size: number of bytes uploaded}
     */
    async upload(nodeid, source, target) {
        let files = await this.file_explorer(nodeid)
        return files.upload(source, target)
    }

    /** Friendly wrapper around {@link Session#upload} to upload from a filepath. Creates a ReadableStream and calls upload.
     * @param {string} nodeid - Unique id to upload file to
     * @param {string} filepath - Path from which to read the data
     * @param {string} target - Path which to upload file to on remote device
     * @returns {Promise<Object>} - {result: bool whether upload succeeded, size: number of bytes uploaded}
     */
    async upload_file(nodeid, filepath, target) {
        f = fs.createReadStream(filepath)
        return this.upload(nodeid, f, target)
    }

    /** Download a file from a device into a writable stream. This creates an _File and destroys it every call. If you need to upload multiple files, use {@link Session#file_explorer} instead.
     * @param {string} nodeid - Unique id to download file from
     * @param {string} source - Path from which to download from device
     * @param {WritableStream} [target=null] - Stream to which to write data. If null, create new PassThrough stream which is both readable and writable.
     * @returns {Promise<WritableStream>} The stream which has been downloaded into
     */
    async download(nodeid, source, target=null) {
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

    /** Friendly wrapper around {@link Session#download} to download to a filepath. Creates a WritableStream and calls download.
     * @param {string} nodeid - Unique id to download file from
     * @param {string} source - Path from which to download from device
     * @param {string} filepath - Path to which to download data
     * @returns {Promise<WritableStream>} The stream which has been downloaded into
     */
    async download_file(nodeid, source, filepath) {
        let f = fs.createWriteStream(filepath)
        return this.download(nodeid, source, {target: f})
    }

    /** Create, initialize, and return an _File object for the given node
     * @param {string} nodeid - Unique id on which to open file explorer
     * @returns {Promise<_Files>} A newly initialized file explorer.
     */
    async file_explorer(nodeid) {
        return await _Files.create(this, nodeid)
    }

    _checkAmtPassword(p) { return (p.length > 7) && (/\d/.test(p)) && (/[a-z]/.test(p)) && (/[A-Z]/.test(p)) && (/\W/.test(p)); }
    _getRandomAmtPassword() { var p; do { p = Buffer.from(crypto.randomBytes(9), 'binary').toString('base64').split('/').join('@'); } while (this._checkAmtPassword(p) == false); return p; }
    _getRandomHex(count) { return Buffer.from(crypto.randomBytes(count), 'binary').toString('hex'); }

}

/**
 * Wrapper around {@link _Shell} that tries to use a regex to detect when a command has finished running and the shell is ready for a new command
 */
class _SmartShell {
    /**
     * Constructor for _SmartShell
     * @param {_Shell} shell - The shell object to wrap with our smart shell
     * @param {regex} regex - Regex to watch the terminal to signify a new command is ready
     */
    constructor(shell, regex) {
        this._shell = shell
        this._regex = regex
        // This comes twice. Test this for sanity
        this._shell.expect(this._regex).then((data)=>{
            this._shell.expect(this._regex)
        })
    }

    /**
     * Send a command and wait for it to return
     * @param {string} command - Command to write
     * @return {Promise<Buffer>} - Data received from command
     */
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

    /**
     * Close this smart shell and the underlying shell
     */
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
        this.alive = false
    }

    static async create(...args) {
        if (this === _Tunnel) {
            throw Error("AbstractClass")
        }
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
                    this.alive = false
                });
                this._sock.on('error', (err) => {
                    this._socket_open.reject(err.code)
                    this.alive = false
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

/** Class to control a virtual file explorer on a remote device
 * @class
 * @props {boolean} recorded - Whether the file session is being recored. Set in initialization.
 */
class _Files extends _Tunnel {
    /** Constructor for _Files
     * @param {Session} session - Session representing a logged in user
     * @param {string} node_id - Node on which to open the file explorer
     * @returns {_Files} Instance of _Files
     */
    constructor(session, node_id) {
        super(session, node_id, PROTOCOL.files)
        this.recorded = null
        this._request_id = 0
        this._requests = {}
        this._request_queue = []
        this._download_finished = new _Deferred()
        this._download_finished.resolve()

        this._initialize()

        this.initialized.then(()=>{
            this._sock.on("close", this._on_close.bind(this))
        })
    }

    /** Factory for _Files
     * @name _Files.create
     * @function
     * @static
     * @param {Session} session - Session representing a logged in user
     * @param {string} node_id - Node on which to open the file explorer
     * @returns {_Files} Instance of _Files which has been initialized
     */


    _get_request_id(){
        this._request_id = this._request_id++%(2**32-1)
        return this._request_id
    }

    _on_close() {
        let req
        while (req = this._request_queue.shift()) {
            req.finished.reject("Socket closed")
        }
    }

    async _send_command(data, name) {
        let id = `meshctrl_${name}_${this._get_request_id()}`
        this._requests[id] = {id: id, type: name, finished: new _Deferred()}
        this._request_queue.push(this._requests[id])
        let r = ()=>{
            if (this.alive) {
                this._sock.send(JSON.stringify(Object.assign({}, data, { responseid: id })))
                return this._requests[id].finished
            }
        }
        return this._download_finished = this._download_finished.then(r, r)
        
    }

    /** Return a directory listing from the device
     * @param {string} directory - Path to the directory you wish to list
     * @returns {Promise<Object[]>} - An array of objects representing the directory listing
     */
    async ls(directory) {
        return this._send_command({action: "ls", path: directory}, "ls").then(data=>{
            return data.dir
        })
    }

    /** Return a directory listing from the device
     * @param {string} directory - Path to the directory you wish to list
     * @returns {Promise<boolean>} - True if firectory creation succeeded
     */
    async mkdir(directory) {
        let l = this._session.listen_to_events((data)=>{
            this._session.stop_listening_to_events(l)
            this._session.stop_listening_to_events(l2)
            let req = this._request_queue.shift()
            delete this._requests[req.id]
            req.finished.resolve(true)
        }, {"event": {"etype": "node", "action": "agentlog"}})
        let l2 = this._session.listen_to_events((data)=>{
            this._session.stop_listening_to_events(l)
            this._session.stop_listening_to_events(l2)
            let req = this._request_queue.shift()
            delete this._requests[req.id]
            req.finished.reject(new ServerError(data.value))
        }, {action:"msg", type:"console"})
        return this._send_command({action: "mkdir", path: directory}, "mkdir")
    }

    /** Remove files/folder from the device. This API doesn't error if the file doesn't exist.
     * @param {string} path - Directory from which to delete files
     * @param {string} files - Array of filenames to remove
     * @param {boolean} [recursive=false] - Whether to delete the files recursively
     * @returns {Promise<string>} - Message returned from server
     * @throws {ServerError} Error text from server if there is a failure
     */
    async rm(path, files, recursive=false) {
        if (typeof(files) === "string") { files = [files] }
        let l = this._session.listen_to_events((data)=>{
            this._session.stop_listening_to_events(l)
            this._session.stop_listening_to_events(l2)
            let req = this._request_queue.shift()
            delete this._requests[req.id]
            req.finished.resolve(data.event.msg)
        }, {"event": {"etype": "node", "action": "agentlog"}})
        let l2 = this._session.listen_to_events((data)=>{
            this._session.stop_listening_to_events(l)
            this._session.stop_listening_to_events(l2)
            let req = this._request_queue.shift()
            delete this._requests[req.id]
            req.finished.reject(new ServerError(data.value))
        }, {action:"msg", type:"console"})
        return this._send_command({action: "rm", delfiles: files, rec: recursive, path: path}, "mkdir")
    }

    /** Rename a file or folder on the device. This API doesn't error if the file doesn't exist.
     * @param {string} path - Directory from which to rename the file
     * @param {string} name - File which to rename
     * @param {string} new_name - New name to give the file
     * @returns {Promise<string>} - Message returned from server
     * @throws {ServerError} Error text from server if there is a failure
     */
    async rename(path, name, new_name) {
        let l = this._session.listen_to_events((data)=>{
            this._session.stop_listening_to_events(l)
            this._session.stop_listening_to_events(l2)
            let req = this._request_queue.shift()
            delete this._requests[req.id]
            req.finished.resolve(data.event.msg)
        }, {"event": {"etype": "node", "action": "agentlog"}})
        let l2 = this._session.listen_to_events((data)=>{
            this._session.stop_listening_to_events(l)
            this._session.stop_listening_to_events(l2)
            let req = this._request_queue.shift()
            delete this._requests[req.id]
            req.finished.reject(new ServerError(data.value))
        }, {action:"msg", type:"console"})
        return this._send_command({action: "rename", path: path, oldname: name, newname: new_name}, "rename")
    }

    async upload(source, target, {name=null}={}) {
        if (source.readableEnded) {
            throw Error("Cannot upload from ended readable")
        }
        let request_id = `upload_${this._get_request_id()}`
        let outstream = new _SizeChunker(65564)
        this._requests[request_id] = {id: request_id, type: "upload", source: source, chunker: outstream, target: target, name: name, size: 0, chunks: [], complete: false, has_data: new _Deferred(), inflight: 0, finished: new _Deferred()}
        this._request_queue.push(this._requests[request_id])
        let f = ()=>{
            if (this.alive) {
                this._sock.send(JSON.stringify({ action: 'upload', reqid: request_id, path: target, name: name}))
                this._eventer.once(request_id, (data)=>{
                    let req = this._request_queue.shift()
                    delete this._requests[req.id]
                    if (data.result == "success") {
                        req.finished.resolve(data)
                    } else {
                        req.finished.reject(data)
                    }
                })
                return this._requests[request_id].finished
            }
        }
        this._download_finished = this._download_finished.then(f, f)
        return this._download_finished
    }

    async download(source, target) {
        let request_id = `download_${this._get_request_id()}`
        this._requests[request_id] = {id: request_id, type: "download", source: source, target: target, size: 0, finished: new _Deferred()}
        this._request_queue.push(this._requests[request_id])
        let f = ()=>{
            if (this.alive) {
                this._sock.send(JSON.stringify({ action: 'download', sub: 'start', id: request_id, path: source }))
                this._eventer.once(request_id, (data)=>{
                    let req = this._request_queue.shift()
                    delete this._requests[req.id]
                    if (data.result == "success") {
                        req.finished.resolve(data)
                    } else {
                        req.finished.reject(data)
                    }
                })
                return this._requests[request_id].finished
            }
        }
        this._download_finished = this._download_finished.then(f, f)
        return this._download_finished
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
        req.finished.resolve(data)
    }

    _receive_message(raw_data) {
        var data = raw_data.toString();
        if (this.initialized.resolved) {
            if (raw_data[0] === 123 && this._request_queue.length && !["upload", "download"].includes(this._request_queue[0].type)) {
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
            this.alive = true
        }
    }
}

/** Class for Mesh Central agent shell
 * @prop {_Deferred} initialized - Promise which is resolved when session is initialized, and rejected upon failure
 * @prop {bool} alive - Whether the session is currently alive*/
class _Shell extends _Tunnel {

    /** Constructor for _Shell
     * @param {Session} session - Session representing a logged in user
     * @param {string} node_id - Node on which to open the shell
     * @returns {_Shell} Instance of _Shell
     */
    constructor(session, node_id) {
        this.recorded = null
        this._buffer = Buffer.alloc(0)
        this._message_queue = []
        this._command_id = 0
        super(session, node_id, PROTOCOL.terminal)

        this._initialize()
    }

    /** Factory for _Shell
     * @name _Shell.create
     * @function
     * @static
     * @param {Session} session - Session representing a logged in user
     * @param {string} node_id - Node on which to open the shell
     * @returns {_Shell} Instance of _Shell which has been initialized
     */

    /** Write to the shell
     * @param {string} command - String to write to the shell
     * @return {Promise} Resolved when data is sent. No verification is performed.
     */
    async write(command) {
        return this._sock.send(Buffer.from(command))
    }

    /** Read from the shell
     * @param {number} [length=null] - Number of bytes to read. null == read until closed or timeout occurs
     * @param {number} [timeout=null] - Milliseconds to wait for data. null == read until `length` bytes are read, or shell is closed.
     * @param {boolean} [return_intermediate=false] - If timeout occurs, return all data read. Otherwise, leave it in the buffer.
     * @return {Promise<Buffer>} Buffer of data read
     * @throws {Object} Containing `reason` for failure, and `data` read so far, if applicable.
     */
    async read(length=null, timeout=null, return_intermediate=false) {
        let start = new Date()
        return new Promise((resolve, reject)=>{
            let check_data = ()=>{
                if ((timeout !== null && new Date() - start > timeout) || this._sock.readyState > 1) {
                    let obj = {reason: this._sock.readyState < 2 ? "timeout" : "closed"}
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

    /** Read data from the shell until `regex` is seen
     * @param {regex} regex - Regular expression to wait for in the shell
     * @param {number} [timeout=null] - Milliseconds to wait for data. null == read until `regex` is seen, or shell is closed.
     * @param {boolean} [return_intermediate=false] - If timeout occurs, return all data read. Otherwise, leave it in the buffer.
     * @return {Promise<Buffer>} Buffer of data read
     * @throws {Object} Containing `reason` for failure, and `data` read so far, if applicable.
     */
    async expect(regex, timeout=null, return_intermediate=false) {
        let data = Buffer.alloc(0),
            start = new Date()

        return new Promise((resolve, reject)=>{
            let check_data = ()=>{
                if ((timeout !== null && new Date() - start > timeout) || this._sock.readyState > 1) {
                    let obj = {reason: this._sock.readyState < 2 ? "timeout" : "closed"}
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

    /**
     * Close this the shell. No more data can be written, but data can still be read from the current buffer.
     */
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

export {Session as default, Session, MESHRIGHTS, USERRIGHTS, CONSENTFLAGS, MESHFEATURES, SHARINGTYPE, SHARINGTYPENUM, PROTOCOL, ICON, _Internal}