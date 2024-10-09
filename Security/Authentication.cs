using Microsoft.AspNet.SignalR.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using static Jabil.Controllers.UserController;

namespace Jabil.Security
{
    public class Authentication:ActionFilterAttribute

    {   DBEntities db = new DBEntities();
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            HttpSessionStateBase session = filterContext.HttpContext.Session;
            HttpContextBase httpContext = filterContext.HttpContext;
         
            var Username = System.Web.HttpContext.Current.User.Identity.Name.Split('\\')[1];
           

            if (!string.IsNullOrEmpty(Username))
            {
                var user = db.Accounts.SingleOrDefault(x => x.JabilID == Username);
                session["account"] = user;
            }
       
            if (session != null && session["account"] == null)
            {
                filterContext.Result = new RedirectToRouteResult(
                    new RouteValueDictionary {

                                { "Controller", "Login" },
                                { "Action", "LoginFail" }
                                });


            }
        }
    }
}
