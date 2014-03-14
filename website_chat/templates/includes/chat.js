
// check agent status

var chat = {};

frappe.ready(function() {
	chat.$sidebar = $(".page-sidebar");
	chat.$messages = $(".chat-messages");
	chat.set_agent_status();
	chat.bind_events();
	if(getCookie("user_id")) {
		$("#client-email").val(getCookie("user_id"))
	}
	if(getCookie("full_name")) {
		$("#client-name").val(getCookie("full_name"))
	}
	frappe.require("/assets/frappe/js/lib/md5.min.js");
});

chat.bind_events = function() {
	chat.welcome();
	chat.send_message();
	setTimeout(chat.sync, 2000);
}

chat.welcome = function() {
	$("#chat-start").on("click", function() {
		var name = $("#client-name").val();
		var email = $("#client-email").val();
		var question = $("#client-question").val();
		if(name && email && question) {
			$.ajax({
				type:"POST",
				url: "api/resource/Website Chat Sesssion",
				data: {
					doclist: JSON.stringify([
						{
							"doctype":"Website Chat Session",
							"client_name": name,
							"client_email_id": email,
							"client_question": question
						}
					])
				},
				statusCode: {
					200: function(data) {
						chat.chatid = data.doclist[0].name;
						chat.chat_session = data.doclist[0];
						chat.client_name = name,
						chat.client_email_id = email,
						chat.start();
						chat.add_message({
							sender: "Client",
							message: question,
							name: ""
						})
					}
				}
			})
		} else {
			frappe.msgprint("All fields are required!")
		}
		return false;
	});
	
}

chat.send_message = function(chatid, question) {
	$("#chat-send-message").on("click", function() {
		var message = $("#chat-input").val();
		if(message) {
			$.ajax({
				type:"POST",
				url: "api/resource/Website Chat Message",
				data: {
					doclist: JSON.stringify([
						{
							"doctype":"Website Chat Message",
							"parent": chat.chatid,
							"parenttype": "Website Chat Session",
							"parentfield": "website_chat_messages",
							"message": message,
							"sender": chat.sender || "Client"
						}
					])
				},
				statusCode: {
					200: function(data) {
						chat.add_message(data.doclist[0]);
					}
				}
			})
			
		}
	})
}

chat.start = function(chatid, question) {
	$(".chat-welcome").addClass("hide");
	$(".chat-sessions").removeClass("hide");
	chat.$messages.empty();
	$("#chat-input").focus();
}

chat.gravatars = {};
chat.get_gravatar = function(email_id) {
	if(!chat.gravatars[email_id]) {
		chat.gravatars[email_id] = "https://secure.gravatar.com/avatar/" + md5(email_id)
	}
	return chat.gravatars[email_id];
}
chat.add_message = function(message, static) {
	if(!message.owner) {
		message.owner = chat.chat_session.client_email_id;
	}
	if(message.sender==="Client") {
		message.alert_class = "warning";
		message.avatar = chat.get_gravatar(message.owner);
	} else {
		message.alert_class = "info";
		message.avatar = chat.get_gravatar(message.owner);
	}

	var div = $(repl('<div class="chat-message alert alert-%(alert_class)s media">\
		<a class="pull-left">\
			<img class="media-object" src="%(avatar)s" style="width: 32px; border-radius: 4px;">\
		</a>\
	    <div class="media-body">\
			%(message)s\
		</div>\
	</div>', message)).appendTo(chat.$messages);
	
	if(static) {
		chat.$messages.scrollTop(chat.$messages[0].scrollHeight);
	} else {
		chat.$messages.animate({ scrollTop: chat.$messages[0].scrollHeight}, 1000);
	}
	
	$("#chat-input").val("").focus();
	chat.last_message_id = message.name;
}

chat.set_agent_status = function() {
	$.ajax({
		url:"api/method/website_chat.templates.pages.chat.get_agent_status",
		statusCode: {
			200: function(data) {
				data = data.message;
				if(data.active_sessions) {
					chat.sender = "Agent";
					chat.set_sessions(data.active_sessions);
				} else {
					chat.agent_status = data.agent_status;
					chat.sender = "Client";
					if(data.message=="active") {
						$(".chat-status").html('<div class="alert alert-success">\
							Agents online. Please enter your name and email to start a session.</div>')
					} else {
						$(".chat-status").html('<div class="alert alert-warning">\
							Agents offline. Please enter your name, email and question. \
								Our agents will get back to you as soon as possible.</div>')
					}
				}
			}
		}
	})
}


chat.set_sync_timeout = function() {
	if(!chat.timeout) {
		chat.timeout = setTimeout(function() { chat.sync() }, 2000);
	}
}

chat.sync = function() {
	chat.timeout = false;
	if(frappe.get_pathname()!=="chat" 
		|| (!chat.center)
		|| (!chat.chatid && chat.center==="Client"))  {
			chat.set_sync_timeout();
	}
	$.ajax({
		url:"/api/method/website_chat.templates.pages.chat.get_latest",
		data: {
			chatid: chat.chatid || "no-chat",
			last_message_id: chat.last_message_id || "",
			sender: chat.sender
		},
		statusCode: {
			200: function(data) {
				data = data.message;
				
				$.each(data.messages || [], function(i, d) {
					chat.add_message(d);
				});
				
				if(chat.sender==="Agent") {
					chat.set_sessions(data.active_sessions);
				}
			}
		}
	}).always(function() {
		chat.set_sync_timeout();
	});
}

chat.sync_messages = function() {
	chat.$messages.html('<div class="alert alert-info">Loading...</div>')
	$.ajax({
		url:"api/resource/Website Chat Session/" + chat.chatid,
		statusCode: {
			200: function(data) {
				chat.$messages.empty();
				chat.chat_session = data.doclist[0];
				chat.add_message({
					sender:"Client",
					message: chat.chat_session.client_question,
					name:""
				}, true);
				$.each(data.doclist, function(i, d) {
					if(d.doctype==="Website Chat Message") {
						chat.add_message(d, true);
					}
				});
			}
		}
	});
}

chat.set_sessions = function(active_sessions) {
	chat.$sidebar.empty();
	
	if(active_sessions.length) {
		$.each(active_sessions, function(i, d) {
			var $item = $('<div class="sidebar-item"></div>').appendTo(chat.$sidebar);
			$('<a>'+d.client_name+'</a>')
				.attr("data-chatid", d.name)
				.appendTo($item)
				.on("click", function() {
					chat.chatid = $(this).attr("data-chatid");
					chat.sync_messages();
				});
		});
	
		// start latest
		if(!chat.chatid) {
			chat.start();
			chat.chatid = active_sessions[0].name;
			chat.sync_messages();
		}
	} else {
		var $item = $('<div class="sidebar-item">No Active Sessions</div>')
			.appendTo(chat.$sidebar);
	}
}
