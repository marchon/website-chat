# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# GNU General Public License. See license.txt 

from __future__ import unicode_literals
import frappe
from frappe import _

no_cache = True

def get_context(context):
	return {
		"title": _("Chat")
	}
	
@frappe.whitelist(allow_guest=True)
def get_agent_status():
	out = {}
	if frappe.get_list("Website Chat Agent", filters={"status":"Active"}, 
		ignore_permissions=True, limit_page_length=1):
		out["agent_status"] = "active"
	else:
		out["agent_status"] = "offline"
			
	if frappe.session.user!="Guest":
		# check if signed-in user is agent
		if frappe.db.get_value("Website Chat Agent", {
			"user": frappe.session.user }):
			
			# send active chats
			out["active_sessions"] = get_active_sessions()
			
	return out

@frappe.whitelist(allow_guest=True)
def get_latest(chatid, sender, last_message_id=""):
	out = {}
	out["messages"] = frappe.get_list("Website Chat Message", 
		fields = ["name", "sender", "message", "owner"],
		filters = {"parent": chatid, "name": [">", last_message_id]},
		order_by = "name desc", 
		ignore_permissions=True)
		
	if sender=="Agent":
		out["active_sessions"] = get_active_sessions()
		
	return out

@frappe.whitelist()
def get_active_sessions():
	# memcache this
	active_sessions = frappe.cache().get_value("website-chat-active-sessions")
	if active_sessions==None:
		active_sessions = frappe.get_list("Website Chat Session",
			fields=["name", "client_name"], filters={"status":"Active"}, 
			order_by="creation desc")
		frappe.cache().set_value("website-chat-active-sessions", active_sessions)

	return active_sessions