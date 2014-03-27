# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# GNU General Public License. See license.txt

from __future__ import unicode_literals
import frappe

from frappe.model.document import Document

class WebsiteChatSession(Document):
	
	def validate(self):
		last_message_by = self.doclist.get({"doctype":"Website Chat Message"})
		
		if last_message_by:
			last_message_by = last_message_by and last_message_by[-1].get("owner")

			if self.doc.status=="Active" and last_message_by==self.doc.client_email_id:
				self.doc.status = "Waiting"
			elif self.doc.status in ("Waiting", "New") and last_message_by!=self.doc.client_email_id:
				self.doc.status = "Active"
			
	def on_update(self):
		frappe.cache().delete_value("website-chat-active-sessions")
		frappe.cache().set_value(self.doc.name, self.doclist)