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
	if chatid != "no-chat":
		doclist = frappe.cache().get_value(chatid)
		if not doclist:
			doclist = frappe.bean("Website Chat Session", chatid).doclist
			frappe.cache().set_value(chatid, doclist)

		out["messages"] = []
		for d in doclist[1:]:
			if d.get("doctype")=="Website Chat Message" and d.get("name") > last_message_id:
				out["messages"].append(d)
	
		out["status"] = doclist[0].get('status')
		
	if sender=="Agent":
		out["active_sessions"] = get_active_sessions()
		
	return out

@frappe.whitelist()
def get_active_sessions():
	# memcache this
	active_sessions = None#frappe.cache().get_value("website-chat-active-sessions")
	if active_sessions==None:
		active_sessions = frappe.get_list("Website Chat Session",
			fields=["name", "client_name", "status"], filters={"status":("in", ("Active", "New"))}, 
			order_by="creation desc")
		frappe.cache().set_value("website-chat-active-sessions", active_sessions)

	return active_sessions
	
@frappe.whitelist(allow_guest=True)
def end_chat(chatid):
	chat = frappe.bean("Website Chat Session", chatid)
	chat.doc.status = "Ended"
	chat.save(ignore_permissions=True)
	
@frappe.whitelist(allow_guest=True)
def set_feedback(chatid, feedback):
	frappe.db.set_value("Website Chat Session", chatid, "feedback", feedback)
	