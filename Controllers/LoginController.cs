using Jabil.Extension;
using Jabil.Security;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Web;
using System.Web.Mvc;

namespace Jabil.Controllers
{   
    public class LoginController : Controller
    {
        
        // GET: Login
        private readonly DBEntities db = new DBEntities();
        public ActionResult Index()
        {
          var username =   System.Web.HttpContext.Current.User.Identity.Name;
          var username1 = System.Environment.UserName;
            ViewBag.Username = username;
            ViewBag.Username1 = username1;
            return View();
        }
        [HttpPost]
        public JsonResult Login(Account formData)
        {
            try
            {
                var user = db.Accounts.SingleOrDefault(x => x.AccountName.Trim() == formData.AccountName);
                if (user != null)
                {
                    if (BCrypt.Net.BCrypt.Verify(formData.Password, user.Password))

                    {
                        Session["account"] = user;

                       

                        return Json(new { status = true, message = "Thành Công!" }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { status = false, message = "Không Đúng Mật Khẩu!" }, JsonRequestBehavior.AllowGet);
                    }
                }
                else
                {
                    return Json(new { status = false, message = "Không Đúng Thông Tin Tài Khoản!" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception e)
            {
                return Json(new { status = false, message = "Thất Bại" + e.Message }, JsonRequestBehavior.AllowGet);
            }

        }
        [HttpGet]
        public JsonResult GetCurrentAccount()
        {
            try
            {
                var user = (Account)Session["account"];
                Session["RoleName"] = user.Role.RoleName;
                var role = Session["RoleName"];
                user = db.Accounts.SingleOrDefault(a => a.AccountID.Equals(user.AccountID));
                Session["account"] = user;
                return Json(new { status = true, 
                    user = new {user.AccountID,
                        user.AccountName,
                        user.FullName,user.FXReader, 
                        user.Role.RoleName, 
                        user.CustomerID,
                        user.JabilID_ID,
                        user.JabilID,
                        Customers = user.CustomerOfUsers.Select(c => new {id = c.CusID, text = c.CusName}),
                        Machines = db.MachineOfCustomers.Where(m => m.CusID == user.CustomerID.Value).Select(m => new { id = m.MachineID, text = m.Machine.MachineInfo }).ToList()
                    },
                }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { status = false, message = "Thất Bại" + e.Message }, JsonRequestBehavior.AllowGet);
            }

        }
        public ActionResult LogOut()
        {

            Session.Abandon();
            return RedirectToAction("Index", "Login");

        }
        public ActionResult LoginFail()
        {
            return View("Error");
        }
    }
    
}