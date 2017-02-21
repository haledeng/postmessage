# postmessage
A library wraps `postMessage` and `getMessage`.

### API
By default, data will be stored in localstorage. Cookie will be instead while localstorage is disabled.

#### getMessage
Get storage from a iframe proxy page.
```
PM.getMessage(function(data) {
	
});
```


#### postMessage
Set storage.
```
PM.postMessage({
	time: +new Date(),
	data: {
		state: 0,
		items: [{
			id: 1,
			name: 'jack'
		}]
	}
});
```

#### deleteKey
Delete a key.
```
PM.deleteKey('time');
```

#### clearAll
Clear storage.
```
PM.clearAll();
```


### Browser Support
IE8+ and modern browser.

