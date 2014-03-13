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
	if frappe.get_list("Website Chat Agent", filters={"status":"Active"}, 
		ignore_permissions=True, limit_page_length=1):
		return "active"
	else:
		return "inactive"
