(function($){
	var EMPTY_STRING = '';

	var db;

	var openRequest = window.indexedDB.open("listnotedb",1);
	openRequest.onupgradeneeded = function(e) {
		var thisDB = e.target.result;
		if(!thisDB.objectStoreNames.contains("Notes")) {
			thisDB.createObjectStore("Notes", { autoIncrement : true });
		}
	}

	openRequest.onsuccess = function(e) {
		db = e.target.result;
		$( "#inputForm" ).submit(createNote);
		renderList();
	}

	openRequest.onerror = function(e) {
		console.log("Open Error!");
		console.dir(e);
	}

	function createNote() {
		var transaction = db.transaction(["Notes"],"readwrite");
		var store = transaction.objectStore("Notes");

		var createAuthname=document.getElementById("createAuthname").value.trim();
		var createSubject=document.getElementById("createSubject").value.trim();
		var createMessage=document.getElementById("createMessage").value.trim();
		creationTime =new Date();
		var request = store.add({authorName: createAuthname, subject: createSubject, message:createMessage, creationTime:creationTime, updateTime:creationTime});
		request.onerror = function(e) {
			console.log("Error",e.target.error.name);
				//some type of error handler
			}
			request.onsuccess = function(e) {
				$('#inputFormModal').modal('hide');
				renderList();
				$( "#inputForm" )[0].reset();
			}
	}

	function renderList(){
		$('#dataContainer').empty();

		//Count Objects
		var transaction = db.transaction(['Notes'], 'readonly');
		var store = transaction.objectStore('Notes');
		var noteCount;
		var countRequest = store.count();
		countRequest.onsuccess = function(e){
			noteCount = e.target.result;
			$('.note-count').html('Count '+noteCount);
			if(noteCount > 0){
				store.openCursor().onsuccess = function(event) {
					var cursor = event.target.result;
					if (cursor) {
						var $div = $('<div class="col-md-4">');
						var $subject = $('<h2>'+returnSafeString(cursor.value.subject)+'</h2>');
						var $characterCount = $('<p>'+cursor.value.message.length +' character long</p>');
						var $date = $('<p>'+cursor.value.updateTime.toGMTString() +'</p>');
						var $moreInfo = $('<a class="btn btn-default" href="#" '
							+'data-subject="'+returnSafeString(cursor.value.subject) +'" '
							+'data-author-name="'+returnSafeString(cursor.value.authorName) +'" '
							+'data-message="'+returnSafeString(cursor.value.message) +'" '
							+'data-note-key="'+cursor.key +'" '
							+'data-created-date="'+cursor.value.creationTime.toGMTString() +'" '
							+'data-updated-date="'+cursor.value.updateTime.toGMTString() +'" '
							+'data-toggle="modal" '
							+'data-target="#moreInfoModal">More Info</a>');
						$moreInfo.click(renderMoreInfoModal);
						var $deleteNoteLink = $('<a class="btn btn-default" href="#" '
							+'data-note-key="'+cursor.key +'">Delete</a>');
						$deleteNoteLink.click(deleteNote);

						$div.append($subject);
						$div.append($characterCount);
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

	function returnSafeString(unsafe_str){
		return unsafe_str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	}
	

	function renderMoreInfoModal(){
		$('#moreInfoModal .modal-title').html(returnSafeString($(this).data('subject')));
		$('#moreInfoModal .subtitle').html('By -'+ returnSafeString($(this).data('authorName')));
		$('#moreInfoModal .modal-body p').html(returnSafeString($(this).data('message')));
		$('#moreInfoModal .updated-date').html('Updated: '+$(this).data('updatedDate'));
		$('#moreInfoModal .created-date').html('Created: '+ $(this).data('createdDate'));
		$('.update-btn').attr("data-note-key",$(this).data('noteKey'));
		$('.update-btn').click(loadNoteToUpdate);
	}

	function updateNote() {
		var transaction = db.transaction(["Notes"],"readwrite");
		var store = transaction.objectStore("Notes");
		var updateAuthname=document.getElementById("updateAuthname").value.trim();
		var updateSubject=document.getElementById("updateSubject").value.trim();
		var updateMessage=document.getElementById("updateMessage").value.trim();
		var creationTime=document.getElementById("updateCreation").value.trim();
		var noteKey=parseInt(document.getElementById("updateNoteKey").value.trim());
		updateTime = new Date();

		var noteToUpdate = store.get(noteKey);

		noteToUpdate.onsuccess = function(event){
			var data = noteToUpdate.result;
			data.authorName = updateAuthname;
			data.subject = updateSubject;
			data.message = updateMessage;
			data.updateTime = updateTime;
			var updateNoteRequest = store.put(data, noteKey);
			updateNoteRequest.onsuccess = function() {
				$('#updateFormModal').modal('hide');
				renderList();
  			};
		};
	}

	function loadNoteToUpdate(){
		key = $(this).data('noteKey');
		var transaction = db.transaction(['Notes'], 'readonly');
		var store = transaction.objectStore('Notes');
		var request = store.get(key);
		request.onerror = function(event) {
		  console.log("Error",e.target.error.name);
		};
		request.onsuccess = function(event) {
			$('#moreInfoModal').modal('hide');
			$('#updateFormModal').modal('show');
			$('#updateAuthname').val(event.target.result.authorName);
			$('#updateSubject').val(event.target.result.subject);
			$('#updateMessage').val(event.target.result.message);
			$('#updateCreation').val(event.target.result.creationTime);
			$('#updateNoteKey').val(key);
			$( "#updateForm" ).submit(updateNote);
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