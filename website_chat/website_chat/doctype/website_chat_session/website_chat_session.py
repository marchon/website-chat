# Copyright (c) 2013, Web Notes Technologies Pvt. Ltd. and Contributors
# GNU General Public License. See license.txt

from __future__ import unicode_literals
import frappe

class DocType:
	def __init__(self, d, dl):
		self.doc, self.doclist = d, dl
	
	def validate(self):
		if self.doc.status=="New":
			if self.doclist.get({
				"doctype":"Website Chat Message", 
				"owner":("!=", self.doc.client_email_id)
			}):
				self.doc.status = "Active"
	
	def on_update(self):
		frappe.cache().delete_value("website-chat-active-sessions")
		frappe.cache().set_value(self.doc.name, self.doclist)