(function($){
	var EMPTY_STRING = '';


	function isFieldNotEmpty(value, alertElement){
		if(value===EMPTY_STRING || value===null){
			alert(alertElement.getAttribute("data-label") +" is Empty");
			return false;
		}
		return true;
	}

	//console.log('js loaded....');
	var db;

	var openRequest = indexedDB.open("listnotedb",1);
	openRequest.onupgradeneeded = function(e) {
		var thisDB = e.target.result;
		if(!thisDB.objectStoreNames.contains("Notes")) {
			thisDB.createObjectStore("Notes", { autoIncrement : true });
		}
	}

	openRequest.onsuccess = function(e) {
		db = e.target.result;
		document.getElementById('createNote').addEventListener('click', createNote);
        renderList();
	}

	openRequest.onerror = function(e) {
		console.log("Open Error!");
		console.dir(e);
	}

	function createNote() {
		var transaction = db.transaction(["Notes"],"readwrite");
		var store = transaction.objectStore("Notes");
		
		var createAuthNameElement=document.getElementById("createAuthname");
    	var createSubjectElement=document.getElementById("createSubject");
    	var createMessageElement=document.getElementById("createMessage");

		var createAuthname=createAuthNameElement.value.trim();
    	var createSubject=createSubjectElement.value.trim();
    	var createMessage=createMessageElement.value.trim();
		if(isFieldNotEmpty(createAuthname, createAuthNameElement) && isFieldNotEmpty(createSubject, createSubjectElement) && isFieldNotEmpty(createMessage, createMessageElement)){
			creationTime =new Date();
			var request = store.add({authorName: createAuthname, subject: createSubject, message:createMessage, creationTime:creationTime, updateTime:creationTime});
			request.onerror = function(e) {
				console.log("Error",e.target.error.name);
		        //some type of error handler
		    }
		    request.onsuccess = function(e) {
		    	createAuthNameElement.innerHTML = EMPTY_STRING;
		    	createSubjectElement.innerHTML = EMPTY_STRING;
		    	createMessageElement.innerHTML = EMPTY_STRING;
		    	$('#inputFormModal').modal('hide');
		    	renderList();
		    }

		}
	}

	function renderList(){
		$('#dataContainer').empty();
		//$('#list-wrapper').html('<table><tr><th>Key</th><th>Text</th></tr></table>');

		//Count Objects
		var transaction = db.transaction(['Notes'], 'readonly');
		var store = transaction.objectStore('Notes');
		var noteCount;
		var countRequest = store.count();
		countRequest.onsuccess = function(e){
			debugger;
			noteCount = e.target.result;
			$('.note-count').html('Count '+noteCount);
			if(noteCount > 0){
				store.openCursor().onsuccess = function(event) {
					var cursor = event.target.result;
					if (cursor) {
						var $div = $('<div class="col-md-4">');
						var $subject = $('<h2>'+cursor.value.subject+'</h2>');
						var $date = $('<p>'+cursor.value.updateTime.toGMTString() +'</p>');
						var $moreInfo = $('<a class="btn btn-default" href="#" '
							+'data-subject="'+cursor.value.subject +'" '
							+'data-author-name="'+cursor.value.authorName +'" '
							+'data-message="'+cursor.value.message +'" '
							+'data-created-date="'+cursor.value.creationTime +'" '
							+'data-updated-date="'+cursor.value.updateTime +'" '
							+'data-toggle="modal" '
							+'data-target="#moreInfoModal">More Info</a>');
						$moreInfo.click(renderModal);
						var $deleteNoteLink = $('<a class="btn btn-default" href="#" '
							+'data-note-key="'+cursor.key +'">Delete</a>');
						$deleteNoteLink.click(deleteNote);

						$div.append($subject);
						$div.append($date);
						$div.append($moreInfo);
						$div.append($deleteNoteLink);
						$('#dataContainer').append($div);
						cursor.continue();
					}
				};
			}else{
				$('#dataContainer').html('Sorry we have no notes')
			}
		};

	}

	function renderModal(){
		$('#moreInfoModal .modal-title').html($(this).data('subject'));
		$('#moreInfoModal .subtitle').html('By -'+ $(this).data('authorName'));
		$('#moreInfoModal .modal-body p').html($(this).data('message'))
	}

	function loadTextByKey(key){
		var transaction = db.transaction(['wordliststore'], 'readonly');
		var store = transaction.objectStore('wordliststore');
		var request = store.get(key);
		request.onerror = function(event) {
		  // Handle errors!
		};
		request.onsuccess = function(event) {
		  // Do something with the request.result!
		  $('#detail').html('<h2>' + request.result.text + '</h2>');
		  var $delBtn = $('<button>Delete me</button>');
		  $delBtn.click(function(){
		  	console.log('Delete ' + key);
		  	deleteWord(key);
		  });
		  $('#detail').append($delBtn);
		};
	}

	function deleteNote() {
		var key = $(this).data('noteKey');
		var transaction = db.transaction(['Notes'], 'readwrite');
		var store = transaction.objectStore('Notes');
		var request = store.delete(key);
		request.onsuccess = function(evt){
			renderList();
		};
	}






})(jQuery);