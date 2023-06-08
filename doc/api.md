## Classes

<dl>
<dt><a href="#_Deferred">_Deferred</a></dt>
<dd><p>Simple deferred class to wrap a promise, so it&#39;s readable from outside. This makes certain synchronization easier. Usable like a promise.</p>
</dd>
<dt><a href="#ServerError">ServerError</a> ⇐ <code>Error</code></dt>
<dd><p>Represents an error thrown from the server</p>
</dd>
<dt><a href="#SocketError">SocketError</a> ⇐ <code>Error</code></dt>
<dd><p>Represents an error in the websocket</p>
</dd>
<dt><a href="#ValueError">ValueError</a> ⇐ <code>Error</code></dt>
<dd><p>Represents an error in the user given input</p>
</dd>
<dt><a href="#TimeoutError">TimeoutError</a> ⇐ <code>Error</code></dt>
<dd><p>Represents that a command timed out</p>
</dd>
<dt><a href="#Session">Session</a></dt>
<dd><p>Class for MeshCentral Session</p>
</dd>
<dt><a href="#_SmartShell">_SmartShell</a></dt>
<dd><p>Wrapper around <a href="#_Shell">_Shell</a> that tries to use a regex to detect when a command has finished running and the shell is ready for a new command</p>
</dd>
<dt><a href="#_Files">_Files</a></dt>
<dd><p>Class to control a virtual file explorer on a remote device</p>
</dd>
<dt><a href="#_Shell">_Shell</a></dt>
<dd><p>Class for Mesh Central agent shell</p>
</dd>
</dl>

<a name="_Deferred"></a>

## \_Deferred
Simple deferred class to wrap a promise, so it's readable from outside. This makes certain synchronization easier. Usable like a promise.

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| resolved | <code>boolean</code> | Whether the promise has resolved |
| rejected | <code>boolean</code> | Whether the promise has rejected |

<a name="ServerError"></a>

## ServerError ⇐ <code>Error</code>
Represents an error thrown from the server

**Kind**: global class  
**Extends**: <code>Error</code>  
<a name="SocketError"></a>

## SocketError ⇐ <code>Error</code>
Represents an error in the websocket

**Kind**: global class  
**Extends**: <code>Error</code>  
<a name="ValueError"></a>

## ValueError ⇐ <code>Error</code>
Represents an error in the user given input

**Kind**: global class  
**Extends**: <code>Error</code>  
<a name="TimeoutError"></a>

## TimeoutError ⇐ <code>Error</code>
Represents that a command timed out

**Kind**: global class  
**Extends**: <code>Error</code>  
<a name="Session"></a>

## Session
Class for MeshCentral Session

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| initialized | [<code>\_Deferred</code>](#_Deferred) | Promise which is resolved when session is initialized, and rejected upon failure |
| alive | <code>bool</code> | Whether the session is currently alive |


* [Session](#Session)
    * [new Session(url, [options])](#new_Session_new)
    * _instance_
        * [.close()](#Session+close)
        * [.server_info()](#Session+server_info) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.user_info()](#Session+user_info) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.send_invite_email(group, email, [options], [timeout])](#Session+send_invite_email) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.generate_invite_link(group, hours, [options], [timeout])](#Session+generate_invite_link) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.list_users([timeout])](#Session+list_users) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
        * [.list_user_sessions([timeout])](#Session+list_user_sessions) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
        * [.list_user_groups([timeout])](#Session+list_user_groups) ⇒ <code>Promise.&lt;(Array.&lt;Object&gt;\|null)&gt;</code>
        * [.list_device_groups([timeout])](#Session+list_device_groups) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
        * [.list_devices([options], [timeout])](#Session+list_devices) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
        * [.on_close(f)](#Session+on_close)
        * [.listen_to_events(f, [filter])](#Session+listen_to_events) ⇒ <code>function</code>
        * [.stop_listening_to_events(Callback)](#Session+stop_listening_to_events)
        * [.list_events([options], [timeout])](#Session+list_events) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
        * [.list_login_tokens([timeout])](#Session+list_login_tokens) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
        * [.add_login_token(name, [expire], [timeout])](#Session+add_login_token) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.remove_login_token(name, [timeout])](#Session+remove_login_token) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
        * [.add_user(name, password, [options], [timeout])](#Session+add_user) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.edit_user(userid, [options], [timeout])](#Session+edit_user) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.remove_user(userid, [timeout])](#Session+remove_user) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.add_user_group(name, [description], [timeout])](#Session+add_user_group) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.remove_user_group(userid, [timeout])](#Session+remove_user_group) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.add_users_to_user_group(ids, groupid, [timeout])](#Session+add_users_to_user_group) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
        * [.remove_user_from_user_group(id, groupid, [timeout])](#Session+remove_user_from_user_group) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.add_users_to_device(userids, nodeid, [rights], [timeout])](#Session+add_users_to_device) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.remove_users_from_device(nodeid, userids, [timeout])](#Session+remove_users_from_device) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.add_device_group(name, [options], [timeout])](#Session+add_device_group) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.remove_device_group(meshid, [isname], [timeout])](#Session+remove_device_group) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.edit_device_group(meshid, [options], [timeout])](#Session+edit_device_group) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.move_to_device_group(nodeids, meshid, [isname], [timeout])](#Session+move_to_device_group) ⇒ <code>Promise.&lt;Boolean&gt;</code>
        * [.add_users_to_device_group(userids, meshid, [options], [timeout])](#Session+add_users_to_device_group) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.remove_users_from_device_group(userids, meshid, [isname], [timeout])](#Session+remove_users_from_device_group) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.broadcast(message, [userid], [timeout])](#Session+broadcast) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.device_info(nodeid, [timeout])](#Session+device_info) ⇒ <code>Promise</code>
        * [.edit_device(nodeid, [options], [timeout])](#Session+edit_device) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.run_command(nodeids, command, [options], [timeout])](#Session+run_command) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.shell(nodeid)](#Session+shell) ⇒ [<code>Promise.&lt;\_Shell&gt;</code>](#_Shell)
        * [.smart_shell(nodeid, regex)](#Session+smart_shell) ⇒ [<code>Promise.&lt;\_SmartShell&gt;</code>](#_SmartShell)
        * [.wake_devices(nodeids, [timeout])](#Session+wake_devices) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.reset_devices(nodeids, [timeout])](#Session+reset_devices) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.sleep_devices(nodeids, [timeout])](#Session+sleep_devices) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.power_off_devices(nodeids, [timeout])](#Session+power_off_devices) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.list_device_shares(nodeid, [timeout])](#Session+list_device_shares) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
        * [.add_device_share(nodeid, name, [options], [timeout])](#Session+add_device_share) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.remove_device_share(nodeid, shareid, [timeout])](#Session+remove_device_share) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.device_open_url(nodeid, url, [timeout])](#Session+device_open_url) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.device_message(nodeid, message, [title], [timeout])](#Session+device_message) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.device_toast(nodeids, message, [title], [timeout])](#Session+device_toast) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.interuser(data, [options])](#Session+interuser)
        * [.upload(nodeid, source, target)](#Session+upload) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.upload_file(nodeid, filepath, target)](#Session+upload_file) ⇒ <code>Promise.&lt;Object&gt;</code>
        * [.download(nodeid, source, [target])](#Session+download) ⇒ <code>Promise.&lt;WritableStream&gt;</code>
        * [.download_file(nodeid, source, filepath)](#Session+download_file) ⇒ <code>Promise.&lt;WritableStream&gt;</code>
        * [.file_explorer(nodeid)](#Session+file_explorer) ⇒ [<code>Promise.&lt;\_Files&gt;</code>](#_Files)
    * _static_
        * [.create(url, [options])](#Session.create) ⇒ [<code>Session</code>](#Session)
    * _inner_
        * [~CloseCallback](#Session..CloseCallback) : <code>function</code>
        * [~EventCallback](#Session..EventCallback) : <code>function</code>

<a name="new_Session_new"></a>

### new Session(url, [options])
Constructor for Session

**Returns**: [<code>Session</code>](#Session) - Instance of Session  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>string</code> |  | URL of meshcentral server to connect to. Should start with either "ws://" or "wss://". |
| [options] | <code>Object</code> | <code>{}</code> | Optional arguments for instantiation |
| [options.user] | <code>string</code> | <code>null</code> | Username of to use for connecting. Can also be username generated from token. |
| [options.domain] | <code>string</code> | <code>null</code> | Domain to connect to |
| [options.password] | <code>string</code> | <code>null</code> | Password with which to connect. Can also be password generated from token. |
| [options.loginkey] | <code>string</code> | <code>null</code> | Key from already handled login. Overrides username/password. |
| [options.proxy] | <code>string</code> | <code>null</code> | "url:port" to use for proxy server |
| [options.token] | <code>string</code> | <code>null</code> | Login token. This appears to be superfluous |

<a name="Session+close"></a>

### session.close()
Close Session

**Kind**: instance method of [<code>Session</code>](#Session)  
<a name="Session+server_info"></a>

### session.server\_info() ⇒ <code>Promise.&lt;Object&gt;</code>
Get server information

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Server info  
<a name="Session+user_info"></a>

### session.user\_info() ⇒ <code>Promise.&lt;Object&gt;</code>
Get user information

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - User info  
<a name="Session+send_invite_email"></a>

### session.send\_invite\_email(group, email, [options], [timeout]) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Send an invite email for a group or mesh

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - true on success  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| group | <code>string</code> |  | Name of mesh to which to invite email |
| email | <code>string</code> |  | Email of user to invite |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.name] | <code>string</code> | <code>null</code> | User's name. For display purposes. |
| [options.message] | <code>string</code> | <code>null</code> | Message to send to user in invite email |
| [options.meshid] | <code>string</code> | <code>null</code> | ID of mesh which to invite user. Overrides "group" |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+generate_invite_link"></a>

### session.generate\_invite\_link(group, hours, [options], [timeout]) ⇒ <code>Promise.&lt;Object&gt;</code>
Generate an invite link for a group or mesh

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Invite link information  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| group | <code>string</code> |  | Name of group to add |
| hours | <code>number</code> |  | Hours until link expires |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.flags] | [<code>MESHRIGHTS</code>](#MESHRIGHTS) | <code></code> | Bitwise flags for MESHRIGHTS |
| [options.meshid] | <code>string</code> | <code>null</code> | ID of mesh which to invite user. Overrides "group" |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+list_users"></a>

### session.list\_users([timeout]) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
List users on server. Admin Only.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> - List of users  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+list_user_sessions"></a>

### session.list\_user\_sessions([timeout]) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
Get list of connected users. Admin Only.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> - List of user sessions  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+list_user_groups"></a>

### session.list\_user\_groups([timeout]) ⇒ <code>Promise.&lt;(Array.&lt;Object&gt;\|null)&gt;</code>
Get user groups. Admin will get all user groups, otherwise get limited user groups

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;(Array.&lt;Object&gt;\|null)&gt;</code> - List of groups, or null if no groups are found  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+list_device_groups"></a>

### session.list\_device\_groups([timeout]) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
Get device groups. Only returns meshes to which the logged in user has access

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> - List of meshes  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+list_devices"></a>

### session.list\_devices([options], [timeout]) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
Get devices to which the user has access.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> - List of nodes  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.details] | <code>boolean</code> | <code>false</code> | Get device details |
| [options.group] | <code>string</code> | <code>null</code> | Get devices from specific group by name. Overrides meshid |
| [options.meshid] | <code>string</code> | <code>null</code> | Get devices from specific group by id |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+on_close"></a>

### session.on\_close(f)
Listen for the socket to close

**Kind**: instance method of [<code>Session</code>](#Session)  

| Param | Type | Description |
| --- | --- | --- |
| f | [<code>CloseCallback</code>](#Session..CloseCallback) | Function to call when the socket closes |

<a name="Session+listen_to_events"></a>

### session.listen\_to\_events(f, [filter]) ⇒ <code>function</code>
Listen to events from the server

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>function</code> - - Function used for listening. Use this to stop listening to events if you want that.  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| f | [<code>EventCallback</code>](#Session..EventCallback) |  | Function to call when an event occurs |
| [filter] | <code>Object</code> | <code></code> | Object to filter events with. Only trigger for events that deep-match this object. Use sets for "array.contains" and arrays for equality of lists. |

<a name="Session+stop_listening_to_events"></a>

### session.stop\_listening\_to\_events(Callback)
Stop listening to server events

**Kind**: instance method of [<code>Session</code>](#Session)  

| Param | Type | Description |
| --- | --- | --- |
| Callback | <code>function</code> | to stop listening with. |

<a name="Session+list_events"></a>

### session.list\_events([options], [timeout]) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
List events visible to the currect user

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> - List of events  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.userid] | <code>string</code> | <code>null</code> | Filter by user. Overrides nodeid. |
| [options.nodeid] | <code>string</code> | <code>null</code> | Filter by node |
| [options.limit] | <code>number</code> | <code></code> | Limit to the N most recent events |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+list_login_tokens"></a>

### session.list\_login\_tokens([timeout]) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
List login tokens for current user. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> - List of tokens  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+add_login_token"></a>

### session.add\_login\_token(name, [expire], [timeout]) ⇒ <code>Promise.&lt;Object&gt;</code>
Create login token for current user. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Created token  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | Name of token |
| [expire] | <code>number</code> | <code></code> | Minutes until expiration. 0 or null for no expiration. |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+remove_login_token"></a>

### session.remove\_login\_token(name, [timeout]) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
Remove login token for current user. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> - List of remaining tokens  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | Name of token or token username |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+add_user"></a>

### session.add\_user(name, password, [options], [timeout]) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Add a new user

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - true on success  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | username |
| password | <code>string</code> |  | user's starting password |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.randompass] | <code>boolean</code> | <code>false</code> | Generate a random password for the user. Overrides password |
| [options.domain] | <code>string</code> | <code>null</code> | Domain to which to add the user |
| [options.email] | <code>string</code> | <code>null</code> | User's email address |
| [options.emailverified] | <code>boolean</code> | <code>false</code> | Pre-verify the user's email address |
| [options.resetpass] | <code>boolean</code> | <code>false</code> | Force the user to reset their password on first login |
| [options.realname] | <code>string</code> | <code>null</code> | User's real name |
| [options.phone] | <code>string</code> | <code>null</code> | User's phone number |
| [options.rights] | [<code>USERRIGHTS</code>](#USERRIGHTS) | <code></code> | Bitwise mask of user's rights on the server |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+edit_user"></a>

### session.edit\_user(userid, [options], [timeout]) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Edit an existing user

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - true on success  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| userid | <code>string</code> |  | Unique userid |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.domain] | <code>string</code> | <code>null</code> | Domain to which to add the user |
| [options.email] | <code>string</code> | <code>null</code> | User's email address |
| [options.emailverified] | <code>boolean</code> | <code>false</code> | Verify or unverify the user's email address |
| [options.resetpass] | <code>boolean</code> | <code>false</code> | Force the user to reset their password on next login |
| [options.realname] | <code>string</code> | <code>null</code> | User's real name |
| [options.phone] | <code>string</code> | <code>null</code> | User's phone number |
| [options.rights] | [<code>USERRIGHTS</code>](#USERRIGHTS) | <code></code> | Bitwise mask of user's rights on the server |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+remove_user"></a>

### session.remove\_user(userid, [timeout]) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Remove an existing user

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - true on success  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| userid | <code>string</code> |  | Unique userid |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+add_user_group"></a>

### session.add\_user\_group(name, [description], [timeout]) ⇒ <code>Promise.&lt;Object&gt;</code>
Create a new user group

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - New user group  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | Name of usergroup |
| [description] | <code>string</code> | <code>null</code> | Description of user group |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+remove_user_group"></a>

### session.remove\_user\_group(userid, [timeout]) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Remove an existing user group

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - true on success  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| userid | <code>string</code> |  | Unique userid |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+add_users_to_user_group"></a>

### session.add\_users\_to\_user\_group(ids, groupid, [timeout]) ⇒ <code>Promise.&lt;Array.&lt;string&gt;&gt;</code>
Add user(s) to an existing user group. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Array.&lt;string&gt;&gt;</code> - List of users that were successfully added  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ids | <code>string</code> \| <code>array</code> |  | Unique user id(s) |
| groupid | <code>string</code> |  | Group to add the given user to |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+remove_user_from_user_group"></a>

### session.remove\_user\_from\_user\_group(id, groupid, [timeout]) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Remove user from an existing user group

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - true on success  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| id | <code>string</code> |  | Unique user id |
| groupid | <code>string</code> |  | Group to remove the given user from |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+add_users_to_device"></a>

### session.add\_users\_to\_device(userids, nodeid, [rights], [timeout]) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Add a user to an existing node

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - true on success  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| userids | <code>string</code> \| <code>array</code> |  | Unique user id(s) |
| nodeid | <code>string</code> |  | Node to add the given user to |
| [rights] | [<code>MESHRIGHTS</code>](#MESHRIGHTS) | <code></code> | Bitwise mask for the rights on the given mesh |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+remove_users_from_device"></a>

### session.remove\_users\_from\_device(nodeid, userids, [timeout]) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Remove users from an existing node

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - true on success  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeid | <code>string</code> |  | Node to remove the given users from |
| userids | <code>string</code> \| <code>array</code> |  | Unique user id(s) |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+add_device_group"></a>

### session.add\_device\_group(name, [options], [timeout]) ⇒ <code>Promise.&lt;Object&gt;</code>
Create a new device group

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - New device group  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| name | <code>string</code> |  | Name of device group |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.description] | <code>string</code> | <code>&quot;\&quot;\&quot;&quot;</code> | Description of device group |
| [options.amtonly] | <code>boolean</code> | <code>false</code> | - |
| [options.features] | [<code>MESHFEATURES</code>](#MESHFEATURES) | <code>0</code> | Bitwise features to enable on the group |
| [options.consent] | [<code>CONSENTFLAGS</code>](#CONSENTFLAGS) | <code>0</code> | Bitwise consent flags to use for the group |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+remove_device_group"></a>

### session.remove\_device\_group(meshid, [isname], [timeout]) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Remove an existing device group

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - true on success  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| meshid | <code>string</code> |  | Unique id of device group |
| [isname] | <code>boolean</code> | <code>false</code> | treat "meshid" as a name instead of an id |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+edit_device_group"></a>

### session.edit\_device\_group(meshid, [options], [timeout]) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Edit an existing device group

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - true on success  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| meshid | <code>string</code> |  | Unique id of device group |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.isname] | <code>boolean</code> | <code>false</code> | treat "meshid" as a name instead of an id |
| [options.name] | <code>string</code> | <code>null</code> | New name for group |
| [options.description] | <code>boolean</code> | <code></code> | New description |
| [options.flags] | [<code>MESHFEATURES</code>](#MESHFEATURES) | <code></code> | Features to enable on the group |
| [options.consent] | [<code>CONSENTFLAGS</code>](#CONSENTFLAGS) | <code></code> | Which consent flags to use for the group |
| [options.invite_codes] | <code>Array.&lt;string&gt;</code> | <code></code> | Create new invite codes |
| [options.backgroundonly] | <code>boolean</code> | <code>false</code> | Flag for invite codes |
| [options.interactiveonly] | <code>boolean</code> | <code>false</code> | Flag for invite codes |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+move_to_device_group"></a>

### session.move\_to\_device\_group(nodeids, meshid, [isname], [timeout]) ⇒ <code>Promise.&lt;Boolean&gt;</code>
Move a device from one group to another

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Boolean&gt;</code> - true on success  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeids | <code>string</code> \| <code>array</code> |  | Unique node id(s) |
| meshid | <code>string</code> |  | Unique mesh id |
| [isname] | <code>boolean</code> | <code>false</code> | treat "meshid" as a name instead of an id |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+add_users_to_device_group"></a>

### session.add\_users\_to\_device\_group(userids, meshid, [options], [timeout]) ⇒ <code>Promise.&lt;object&gt;</code>
Add a user to an existing mesh

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;object&gt;</code> - Object showing which were added correctly and which were not, along with their result messages  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| userids | <code>string</code> \| <code>array</code> |  | Unique user id(s) |
| meshid | <code>string</code> |  | Mesh to add the given user to |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.isname] | <code>boolean</code> | <code>false</code> | Read meshid as a name rather than an id |
| [options.rights] | [<code>MESHRIGHTS</code>](#MESHRIGHTS) | <code>0</code> | Bitwise mask for the rights on the given mesh |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+remove_users_from_device_group"></a>

### session.remove\_users\_from\_device\_group(userids, meshid, [isname], [timeout]) ⇒ <code>Promise.&lt;Object&gt;</code>
Remove users from an existing mesh

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Object showing which were removed correctly and which were not  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| userids | <code>string</code> \| <code>array</code> |  | Unique user id(s) |
| meshid | <code>string</code> |  | Mesh to add the given user to |
| [isname] | <code>boolean</code> | <code>false</code> | Read meshid as a name rather than an id |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+broadcast"></a>

### session.broadcast(message, [userid], [timeout]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Broadcast a message to all users or a single user

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - True if successful  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| message | <code>string</code> |  | Message to broadcast |
| [userid] | <code>string</code> | <code>null</code> | Optional user to which to send the message |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+device_info"></a>

### session.device\_info(nodeid, [timeout]) ⇒ <code>Promise</code>
Get all info for a given device. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise</code> - Object containing all meaningful device info  
**Throws**:

- [<code>ValueError</code>](#ValueError) `Invalid device id` if device is not found
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeid | <code>string</code> |  | Unique id of desired node |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+edit_device"></a>

### session.edit\_device(nodeid, [options], [timeout]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Edit properties of an existing device

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - True if successful  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeid | <code>string</code> |  | Unique id of desired node |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.name] | <code>string</code> | <code>null</code> | New name for device |
| [options.description] | <code>string</code> | <code>null</code> | New description for device |
| [options.tags] | <code>string</code> \| <code>Array.&lt;string&gt;</code> | <code>null</code> | New tags for device |
| [options.icon] | [<code>ICON</code>](#ICON) | <code></code> | New icon for device |
| [options.consent] | [<code>CONSENTFLAGS</code>](#CONSENTFLAGS) | <code></code> | New consent flags for device |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+run_command"></a>

### session.run\_command(nodeids, command, [options], [timeout]) ⇒ <code>Promise.&lt;Object&gt;</code>
Run a command on any number of nodes. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Object containing mapped output of the commands by device  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeids | <code>string</code> \| <code>Array.&lt;string&gt;</code> |  | Unique ids of nodes on which to run the command |
| command | <code>string</code> |  | Command to run |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.powershell] | <code>boolean</code> | <code>false</code> | Use powershell to run command. Only available on Windows. |
| [options.runasuser] | <code>boolean</code> | <code>false</code> | Attempt to run as a user instead of the root permissions given to the agent. Fall back to root if we cannot. |
| [options.runasuseronly] | <code>boolean</code> | <code>false</code> | Error if we cannot run the command as the logged in user. |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+shell"></a>

### session.shell(nodeid) ⇒ [<code>Promise.&lt;\_Shell&gt;</code>](#_Shell)
Open a terminal shell on the given device

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: [<code>Promise.&lt;\_Shell&gt;</code>](#_Shell) - Newly created and initialized _Shell  

| Param | Type | Description |
| --- | --- | --- |
| nodeid | <code>string</code> | Unique id of node on which to open the shell |

<a name="Session+smart_shell"></a>

### session.smart\_shell(nodeid, regex) ⇒ [<code>Promise.&lt;\_SmartShell&gt;</code>](#_SmartShell)
Open a smart terminal shell on the given device

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: [<code>Promise.&lt;\_SmartShell&gt;</code>](#_SmartShell) - Newly created and initialized _SmartShell  

| Param | Type | Description |
| --- | --- | --- |
| nodeid | <code>string</code> | Unique id of node on which to open the shell |
| regex | <code>regex</code> | Regex to watch for to signify that the shell is ready for new input. |

<a name="Session+wake_devices"></a>

### session.wake\_devices(nodeids, [timeout]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Wake up given devices

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - True if successful  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeids | <code>string</code> \| <code>Array.&lt;string&gt;</code> |  | Unique ids of nodes which to wake |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+reset_devices"></a>

### session.reset\_devices(nodeids, [timeout]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Reset given devices

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - True if successful  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeids | <code>string</code> \| <code>Array.&lt;string&gt;</code> |  | Unique ids of nodes which to reset |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+sleep_devices"></a>

### session.sleep\_devices(nodeids, [timeout]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Sleep given devices

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - True if successful  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeids | <code>string</code> \| <code>Array.&lt;string&gt;</code> |  | Unique ids of nodes which to sleep |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+power_off_devices"></a>

### session.power\_off\_devices(nodeids, [timeout]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Power off given devices

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - True if successful  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeids | <code>string</code> \| <code>Array.&lt;string&gt;</code> |  | Unique ids of nodes which to power off |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+list_device_shares"></a>

### session.list\_device\_shares(nodeid, [timeout]) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
List device shares of given node. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> - Array of objects representing device shares  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeid | <code>string</code> |  | Unique id of nodes of which to list shares |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+add_device_share"></a>

### session.add\_device\_share(nodeid, name, [options], [timeout]) ⇒ <code>Promise.&lt;Object&gt;</code>
Add device share to given node. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - Info about the newly created share  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeid | <code>string</code> |  | Unique id of nodes of which to list shares |
| name | <code>string</code> |  | Name of guest with which to share |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.type] | [<code>SHARINGTYPE</code>](#SHARINGTYPE) | <code>SHARINGTYPE.desktop</code> | Type of share thise should be |
| [options.consent] | [<code>CONSENTFLAGS</code>](#CONSENTFLAGS) | <code></code> | Consent flags for share. Defaults to "notify" for your given SHARINGTYPE |
| [options.start] | <code>number</code> \| <code>Date</code> | <code>new Date()</code> | When to start the share |
| [options.end] | <code>number</code> \| <code>Date</code> | <code></code> | When to end the share. If null, use duration instead |
| [options.duration] | <code>number</code> | <code>60*60</code> | Duration in seconds for share to exist |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+remove_device_share"></a>

### session.remove\_device\_share(nodeid, shareid, [timeout]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Remove a device share

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - true if successful  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeid | <code>string</code> |  | Unique node from which to remove the share |
| shareid | <code>string</code> |  | Unique share id to be removed |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+device_open_url"></a>

### session.device\_open\_url(nodeid, url, [timeout]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Open url in browser on device. WARNING: Non namespaced call. Calling this function again before it returns may cause unintended consequences.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - true if successful  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- <code>Error</code> `Failed to open url` if failure occurs
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeid | <code>string</code> |  | Unique node from which to remove the share |
| url | <code>string</code> |  | url to open |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+device_message"></a>

### session.device\_message(nodeid, message, [title], [timeout]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Display a message on remote device.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - true if successful  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeid | <code>string</code> |  | Unique node from which to remove the share |
| message | <code>string</code> |  | message to display |
| [title] | <code>string</code> | <code>&quot;\&quot;MeshCentral\&quot;&quot;</code> | message title |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+device_toast"></a>

### session.device\_toast(nodeids, message, [title], [timeout]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Popup a toast a message on remote device.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - true if successful  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure
- [<code>TimeoutError</code>](#TimeoutError) Command timed out

**Todo**

- [ ] This function returns true even if it fails, because the server tells us it succeeds before it actually knows, then later tells us it failed, but it's hard to find that because it looks exactly like a success.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeids | <code>string</code> \| <code>Array.&lt;string&gt;</code> |  | Unique node from which to remove the share |
| message | <code>string</code> |  | message to display |
| [title] | <code>string</code> | <code>&quot;\&quot;MeshCentral\&quot;&quot;</code> | message title |
| [timeout] | <code>number</code> | <code></code> | duration in milliseconds to wait for a response before throwing an error |

<a name="Session+interuser"></a>

### session.interuser(data, [options])
Fire off an interuser message. This is a fire and forget api, we have no way of checking if the user got the message.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Throws**:

- [<code>ValueError</code>](#ValueError) Value error if neither user nor session are given.
- [<code>SocketError</code>](#SocketError) Info about socket closure


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| data | <code>serializable</code> |  | Any sort of serializable data you want to send to the user |
| [options] | <code>Object</code> | <code>{}</code> |  |
| [options.session] | <code>string</code> | <code>null</code> | Direct session to send to. Use this after you have made connection with a specific user session. |
| [options.user] | <code>string</code> | <code>null</code> | Send message to all sessions of a particular user. One of these must be set. |

<a name="Session+upload"></a>

### session.upload(nodeid, source, target) ⇒ <code>Promise.&lt;Object&gt;</code>
Upload a stream to a device. This creates an _File and destroys it every call. If you need to upload multiple files, use [file_explorer](#Session+file_explorer) instead.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - - {result: bool whether upload succeeded, size: number of bytes uploaded}  

| Param | Type | Description |
| --- | --- | --- |
| nodeid | <code>string</code> | Unique id to upload stream to |
| source | <code>ReadableStream</code> | ReadableStream from which to read data |
| target | <code>string</code> | Path which to upload stream to on remote device |

<a name="Session+upload_file"></a>

### session.upload\_file(nodeid, filepath, target) ⇒ <code>Promise.&lt;Object&gt;</code>
Friendly wrapper around [upload](#Session+upload) to upload from a filepath. Creates a ReadableStream and calls upload.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - - {result: bool whether upload succeeded, size: number of bytes uploaded}  

| Param | Type | Description |
| --- | --- | --- |
| nodeid | <code>string</code> | Unique id to upload file to |
| filepath | <code>string</code> | Path from which to read the data |
| target | <code>string</code> | Path which to upload file to on remote device |

<a name="Session+download"></a>

### session.download(nodeid, source, [target]) ⇒ <code>Promise.&lt;WritableStream&gt;</code>
Download a file from a device into a writable stream. This creates an _File and destroys it every call. If you need to upload multiple files, use [file_explorer](#Session+file_explorer) instead.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;WritableStream&gt;</code> - The stream which has been downloaded into  
**Throws**:

- <code>Error</code> String showing the intermediate outcome and how many bytes were downloaded


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| nodeid | <code>string</code> |  | Unique id to download file from |
| source | <code>string</code> |  | Path from which to download from device |
| [target] | <code>WritableStream</code> | <code></code> | Stream to which to write data. If null, create new PassThrough stream which is both readable and writable. |

<a name="Session+download_file"></a>

### session.download\_file(nodeid, source, filepath) ⇒ <code>Promise.&lt;WritableStream&gt;</code>
Friendly wrapper around [download](#Session+download) to download to a filepath. Creates a WritableStream and calls download.

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: <code>Promise.&lt;WritableStream&gt;</code> - The stream which has been downloaded into  

| Param | Type | Description |
| --- | --- | --- |
| nodeid | <code>string</code> | Unique id to download file from |
| source | <code>string</code> | Path from which to download from device |
| filepath | <code>string</code> | Path to which to download data |

<a name="Session+file_explorer"></a>

### session.file\_explorer(nodeid) ⇒ [<code>Promise.&lt;\_Files&gt;</code>](#_Files)
Create, initialize, and return an _File object for the given node

**Kind**: instance method of [<code>Session</code>](#Session)  
**Returns**: [<code>Promise.&lt;\_Files&gt;</code>](#_Files) - A newly initialized file explorer.  

| Param | Type | Description |
| --- | --- | --- |
| nodeid | <code>string</code> | Unique id on which to open file explorer |

<a name="Session.create"></a>

### Session.create(url, [options]) ⇒ [<code>Session</code>](#Session)
Factory for Session

**Kind**: static method of [<code>Session</code>](#Session)  
**Returns**: [<code>Session</code>](#Session) - Instance of Session which has been initialized  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| url | <code>string</code> |  | URL of meshcentral server to connect to. Should start with either "ws://" or "wss://". |
| [options] | <code>Object</code> | <code>{}</code> | Optional arguments for instantiation |
| [options.user] | <code>string</code> | <code>null</code> | Username of to use for connecting. Can also be username generated from token. |
| [options.domain] | <code>string</code> | <code>null</code> | Domain to connect to |
| [options.password] | <code>string</code> | <code>null</code> | Password with which to connect. Can also be password generated from token. |
| [options.loginkey] | <code>string</code> | <code>null</code> | Key from already handled login. Overrides username/password. |
| [options.proxy] | <code>string</code> | <code>null</code> | "url:port" to use for proxy server |
| [options.token] | <code>string</code> | <code>null</code> | Login token. This appears to be superfluous |

<a name="Session..CloseCallback"></a>

### Session~CloseCallback : <code>function</code>
**Kind**: inner typedef of [<code>Session</code>](#Session)  

| Param | Type | Description |
| --- | --- | --- |
| err | [<code>SocketError</code>](#SocketError) | Error explaining the closure to the best of our ability |

<a name="Session..EventCallback"></a>

### Session~EventCallback : <code>function</code>
**Kind**: inner typedef of [<code>Session</code>](#Session)  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Object</code> | Raw event data from the server |

<a name="_SmartShell"></a>

## \_SmartShell
Wrapper around [_Shell](#_Shell) that tries to use a regex to detect when a command has finished running and the shell is ready for a new command

**Kind**: global class  

* [_SmartShell](#_SmartShell)
    * [new _SmartShell(shell, regex)](#new__SmartShell_new)
    * [.send_command(command)](#_SmartShell+send_command) ⇒ <code>Promise.&lt;Buffer&gt;</code>
    * [.close()](#_SmartShell+close)

<a name="new__SmartShell_new"></a>

### new \_SmartShell(shell, regex)
Constructor for _SmartShell


| Param | Type | Description |
| --- | --- | --- |
| shell | [<code>\_Shell</code>](#_Shell) | The shell object to wrap with our smart shell |
| regex | <code>regex</code> | Regex to watch the terminal to signify a new command is ready |

<a name="_SmartShell+send_command"></a>

### _SmartShell.send\_command(command) ⇒ <code>Promise.&lt;Buffer&gt;</code>
Send a command and wait for it to return

**Kind**: instance method of [<code>\_SmartShell</code>](#_SmartShell)  
**Returns**: <code>Promise.&lt;Buffer&gt;</code> - - Data received from command  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>string</code> | Command to write |

<a name="_SmartShell+close"></a>

### _SmartShell.close()
Close this smart shell and the underlying shell

**Kind**: instance method of [<code>\_SmartShell</code>](#_SmartShell)  
<a name="_Files"></a>

## \_Files
Class to control a virtual file explorer on a remote device

**Kind**: global class  
**Props**: <code>boolean</code> recorded - Whether the file session is being recored. Set in initialization.  

* [_Files](#_Files)
    * [new _Files(session, node_id)](#new__Files_new)
    * _instance_
        * [.close()](#_Files+close)
        * [.ls(directory)](#_Files+ls) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
        * [.mkdir(directory)](#_Files+mkdir) ⇒ <code>Promise.&lt;boolean&gt;</code>
        * [.rm(path, files, [recursive])](#_Files+rm) ⇒ <code>Promise.&lt;string&gt;</code>
        * [.rename(path, name, new_name)](#_Files+rename) ⇒ <code>Promise.&lt;string&gt;</code>
    * _static_
        * [.create(session, node_id)](#_Files.create) ⇒ [<code>\_Files</code>](#_Files)

<a name="new__Files_new"></a>

### new \_Files(session, node_id)
Constructor for _Files

**Returns**: [<code>\_Files</code>](#_Files) - Instance of _Files  

| Param | Type | Description |
| --- | --- | --- |
| session | [<code>Session</code>](#Session) | Session representing a logged in user |
| node_id | <code>string</code> | Node on which to open the file explorer |

<a name="_Files+close"></a>

### _Files.close()
Close underlying connection and invalidate any outstanding requests

**Kind**: instance method of [<code>\_Files</code>](#_Files)  
<a name="_Files+ls"></a>

### _Files.ls(directory) ⇒ <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code>
Return a directory listing from the device

**Kind**: instance method of [<code>\_Files</code>](#_Files)  
**Returns**: <code>Promise.&lt;Array.&lt;Object&gt;&gt;</code> - - An array of objects representing the directory listing  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure


| Param | Type | Description |
| --- | --- | --- |
| directory | <code>string</code> | Path to the directory you wish to list |

<a name="_Files+mkdir"></a>

### _Files.mkdir(directory) ⇒ <code>Promise.&lt;boolean&gt;</code>
Return a directory listing from the device

**Kind**: instance method of [<code>\_Files</code>](#_Files)  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - - True if firectory creation succeeded  
**Throws**:

- [<code>SocketError</code>](#SocketError) Info about socket closure


| Param | Type | Description |
| --- | --- | --- |
| directory | <code>string</code> | Path to the directory you wish to list |

<a name="_Files+rm"></a>

### _Files.rm(path, files, [recursive]) ⇒ <code>Promise.&lt;string&gt;</code>
Remove files/folder from the device. This API doesn't error if the file doesn't exist.

**Kind**: instance method of [<code>\_Files</code>](#_Files)  
**Returns**: <code>Promise.&lt;string&gt;</code> - - Message returned from server  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| path | <code>string</code> |  | Directory from which to delete files |
| files | <code>string</code> |  | Array of filenames to remove |
| [recursive] | <code>boolean</code> | <code>false</code> | Whether to delete the files recursively |

<a name="_Files+rename"></a>

### _Files.rename(path, name, new_name) ⇒ <code>Promise.&lt;string&gt;</code>
Rename a file or folder on the device. This API doesn't error if the file doesn't exist.

**Kind**: instance method of [<code>\_Files</code>](#_Files)  
**Returns**: <code>Promise.&lt;string&gt;</code> - - Message returned from server  
**Throws**:

- [<code>ServerError</code>](#ServerError) Error text from server if there is a failure
- [<code>SocketError</code>](#SocketError) Info about socket closure


| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | Directory from which to rename the file |
| name | <code>string</code> | File which to rename |
| new_name | <code>string</code> | New name to give the file |

<a name="_Files.create"></a>

### _Files.create(session, node_id) ⇒ [<code>\_Files</code>](#_Files)
Factory for _Files

**Kind**: static method of [<code>\_Files</code>](#_Files)  
**Returns**: [<code>\_Files</code>](#_Files) - Instance of _Files which has been initialized  

| Param | Type | Description |
| --- | --- | --- |
| session | [<code>Session</code>](#Session) | Session representing a logged in user |
| node_id | <code>string</code> | Node on which to open the file explorer |

<a name="_Shell"></a>

## \_Shell
Class for Mesh Central agent shell

**Kind**: global class  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| initialized | [<code>\_Deferred</code>](#_Deferred) | Promise which is resolved when session is initialized, and rejected upon failure |
| alive | <code>bool</code> | Whether the session is currently alive |


* [_Shell](#_Shell)
    * [new _Shell(session, node_id)](#new__Shell_new)
    * _instance_
        * [.write(command)](#_Shell+write) ⇒ <code>Promise</code>
        * [.read([length], [timeout], [return_intermediate])](#_Shell+read) ⇒ <code>Promise.&lt;Buffer&gt;</code>
        * [.expect(regex, [timeout], [return_intermediate])](#_Shell+expect) ⇒ <code>Promise.&lt;Buffer&gt;</code>
        * [.close()](#_Shell+close)
    * _static_
        * [.create(session, node_id)](#_Shell.create) ⇒ [<code>\_Shell</code>](#_Shell)

<a name="new__Shell_new"></a>

### new \_Shell(session, node_id)
Constructor for _Shell

**Returns**: [<code>\_Shell</code>](#_Shell) - Instance of _Shell  

| Param | Type | Description |
| --- | --- | --- |
| session | [<code>Session</code>](#Session) | Session representing a logged in user |
| node_id | <code>string</code> | Node on which to open the shell |

<a name="_Shell+write"></a>

### _Shell.write(command) ⇒ <code>Promise</code>
Write to the shell

**Kind**: instance method of [<code>\_Shell</code>](#_Shell)  
**Returns**: <code>Promise</code> - Resolved when data is sent. No verification is performed.  

| Param | Type | Description |
| --- | --- | --- |
| command | <code>string</code> | String to write to the shell |

<a name="_Shell+read"></a>

### _Shell.read([length], [timeout], [return_intermediate]) ⇒ <code>Promise.&lt;Buffer&gt;</code>
Read from the shell

**Kind**: instance method of [<code>\_Shell</code>](#_Shell)  
**Returns**: <code>Promise.&lt;Buffer&gt;</code> - Buffer of data read  
**Throws**:

- <code>Object</code> Containing `reason` for failure, and `data` read so far, if applicable.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [length] | <code>number</code> | <code></code> | Number of bytes to read. null == read until closed or timeout occurs |
| [timeout] | <code>number</code> | <code></code> | Milliseconds to wait for data. null == read until `length` bytes are read, or shell is closed. |
| [return_intermediate] | <code>boolean</code> | <code>false</code> | If timeout occurs, return all data read. Otherwise, leave it in the buffer. |

<a name="_Shell+expect"></a>

### _Shell.expect(regex, [timeout], [return_intermediate]) ⇒ <code>Promise.&lt;Buffer&gt;</code>
Read data from the shell until `regex` is seen

**Kind**: instance method of [<code>\_Shell</code>](#_Shell)  
**Returns**: <code>Promise.&lt;Buffer&gt;</code> - Buffer of data read  
**Throws**:

- <code>Object</code> Containing `reason` for failure, and `data` read so far, if applicable.


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| regex | <code>regex</code> |  | Regular expression to wait for in the shell |
| [timeout] | <code>number</code> | <code></code> | Milliseconds to wait for data. null == read until `regex` is seen, or shell is closed. |
| [return_intermediate] | <code>boolean</code> | <code>false</code> | If timeout occurs, return all data read. Otherwise, leave it in the buffer. |

<a name="_Shell+close"></a>

### _Shell.close()
Close this the shell. No more data can be written, but data can still be read from the current buffer.

**Kind**: instance method of [<code>\_Shell</code>](#_Shell)  
<a name="_Shell.create"></a>

### _Shell.create(session, node_id) ⇒ [<code>\_Shell</code>](#_Shell)
Factory for _Shell

**Kind**: static method of [<code>\_Shell</code>](#_Shell)  
**Returns**: [<code>\_Shell</code>](#_Shell) - Instance of _Shell which has been initialized  

| Param | Type | Description |
| --- | --- | --- |
| session | [<code>Session</code>](#Session) | Session representing a logged in user |
| node_id | <code>string</code> | Node on which to open the shell |

<a name="USERRIGHTS"></a>

## USERRIGHTS : <code>enum</code>
- Bitwise flags for user rights

**Kind**: global enum  
**Read only**: true  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| norights | <code>number</code> | User has no rights |
| backup | <code>number</code> | - |
| manageusers | <code>number</code> | User can add or remove users |
| restore | <code>number</code> | - |
| fileaccess | <code>number</code> | - |
| update | <code>number</code> | - |
| locked | <code>number</code> | - |
| nonewgroups | <code>number</code> | - |
| notools | <code>number</code> | - |
| usergroups | <code>number</code> | - |
| recordings | <code>number</code> | - |
| locksettings | <code>number</code> | - |
| allevents | <code>number</code> | - |
| fullrights | <code>number</code> | User has all rights above |

<a name="MESHRIGHTS"></a>

## MESHRIGHTS : <code>enum</code>
- Bitwise flags for mesh rights

**Kind**: global enum  
**Read only**: true  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| norights | <code>number</code> | User has no rights |
| editgroup | <code>number</code> | The right to edit the group |
| manageusers | <code>number</code> | Right to manage users |
| managedevices | <code>number</code> | Right to add/remove/rename devices |
| remotecontrol | <code>number</code> | Remotely control nodes |
| agentconsole | <code>number</code> | Access to the agent console |
| serverfiles | <code>number</code> | - |
| wakedevices | <code>number</code> | Wake up devices from sleep |
| notes | <code>number</code> | - |
| desktopviewonly | <code>number</code> | Only view desktop; no control |
| noterminal | <code>number</code> | Disable terminal |
| nofiles | <code>number</code> | Disable file handling |
| noamt | <code>number</code> | - |
| limiteddesktop | <code>number</code> | - |
| limitedevents | <code>number</code> | - |
| chatnotify | <code>number</code> | - |
| uninstall | <code>number</code> | - |
| noremotedesktop | <code>number</code> | Disable remote desktop |
| remotecommands | <code>number</code> | Right to send commands to device |
| resetpoweroff | <code>number</code> | Right to reset or power off node |
| fullrights | <code>number</code> | User has all rights above |

<a name="CONSENTFLAGS"></a>

## CONSENTFLAGS : <code>enum</code>
- Bitwise flags for

**Kind**: global enum  
**Read only**: true  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| none | <code>number</code> | Use no flags |
| desktopnotify | <code>number</code> | - |
| terminalnotify | <code>number</code> | - |
| filesnotify | <code>number</code> | - |
| desktopprompt | <code>number</code> | - |
| terminalprompt | <code>number</code> | - |
| filesprompt | <code>number</code> | - |
| desktopprivacybar | <code>number</code> | - |
| all | <code>number</code> | Use all flags |

<a name="MESHFEATURES"></a>

## MESHFEATURES : <code>enum</code>
- Bitwise flags for features to be used in meshes

**Kind**: global enum  
**Read only**: true  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| none | <code>number</code> | Use no flags |
| autoremove | <code>number</code> | - |
| hostnamesync | <code>number</code> | - |
| recordsessions | <code>number</code> | Allow recording of sessions |
| all | <code>number</code> | Use all flags |

<a name="SHARINGTYPE"></a>

## SHARINGTYPE : <code>enum</code>
- String constants used to determine which type of device share to create

**Kind**: global enum  
**Read only**: true  
**Properties**

| Name | Type |
| --- | --- |
| desktop | <code>string</code> | 
| terminal | <code>string</code> | 

<a name="SHARINGTYPENUM"></a>

## SHARINGTYPENUM : <code>enum</code>
- Internal enum used to map SHARINGTYPE to the number used by MeshCentral

**Kind**: global enum  
**Read only**: true  
**Properties**

| Name | Type |
| --- | --- |
| desktop | <code>number</code> | 
| terminal | <code>number</code> | 

<a name="ICON"></a>

## ICON : <code>enum</code>
- Which icon to use for a device

**Kind**: global enum  
**Read only**: true  
**Properties**

| Name | Type |
| --- | --- |
| desktop | <code>number</code> | 
| latop | <code>number</code> | 
| phone | <code>number</code> | 
| server | <code>number</code> | 
| htpc | <code>number</code> | 
| router | <code>number</code> | 
| embedded | <code>number</code> | 
| virtual | <code>number</code> | 

