
// check agent status

var chat = {};

frappe.ready(function() {
	chat.set_agent_status();
	chat.bind_events();
});

chat.bind_events = function() {
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
						alert("created");
					}
				}
			})
		} else {
			frappe.msgprint("All fields are required!")
		}
		return false;
	});
}

chat.set_agent_status = function() {
	$.ajax({
		url:"api/method/website_chat.templates.pages.chat.get_agent_status",
		statusCode: {
			200: function(data) {
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
	})
}