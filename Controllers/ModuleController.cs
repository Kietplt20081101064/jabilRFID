using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Jabil.Controllers
{
    public class ModuleController : Controller
    {
        DBEntities db = new DBEntities();
        // GET: Module
        public ActionResult Index()
        {
            return View();
        }
        public ActionResult SettingModule()
        {
            Account user = (Account)Session["account"];
            var Permission = db.Accounts.Find(user.AccountID).Role.Permissions.Select(p => p.PermissionName).ToList();
            ViewBag.UserPermissions = Permission;
            return PartialView();
        }
    }
}