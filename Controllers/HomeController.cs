using Jabil.Models;
using Jabil.Security;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Text.Json;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace Jabil.Controllers
{
    [Authentication]
    public class HomeController : Controller
    {
        DBEntities db = new DBEntities();

        public void ClearAll()
        {
            Session.RemoveAll();
            System.Web.Security.FormsAuthentication.SignOut();
            Response.Cache.SetCacheability(HttpCacheability.NoCache);
            Response.Cache.SetExpires(DateTime.UtcNow.AddHours(-1));
            Response.Cache.SetNoStore();
        }

        

        public ActionResult Index()
        {
            Account user = (Account)Session["account"];
            ServicePointManager.ServerCertificateValidationCallback = ValidateServerCertificate;
            GpiComponent MC = new GpiComponent();
            MC.RegisterNotification(user.FXReader.Trim());
            var Permission = db.Accounts.Find(user.AccountID).Role.Permissions.Select(p => p.PermissionName).ToList();
            ViewBag.UserPermissions = Permission;
            return View();
        }
        internal static bool ValidateServerCertificate(object sender, System.Security.Cryptography.X509Certificates.X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors)
        {
            return true;
        }

        //[HttpPost]
        //public async Task GetRFIDToken()
        //{
        //    try
        //    {

        //        Account account = (Account)Session["account"];
        //        var FX = db.FXReaders.Find(account.FXReader);
        //        var url = FX.IPAddress.Trim();
        //        if (Session["rfidtoken"] == null)
        //        {
        //            //var client = new HttpClient();
        //            //var request = new HttpRequestMessage(HttpMethod.Get, $"https://{url}/cloud/localRestLogin");
        //            //request.Headers.Add("Authorization", "Basic YWRtaW46QWRtaW5AMTIz");
        //            //var response = await client.SendAsync(request);
        //            //response.EnsureSuccessStatusCode();

                   
                    
        //            try
        //            {
        //                //ServicePointManager.ServerCertificateValidationCallback = ValidateServerCertificate;

        //                var client = new HttpClient();
        //                var request = new HttpRequestMessage(HttpMethod.Get, $"https://{url}/cloud/localRestLogin");
        //                request.Headers.Add("Authorization", $"Basic YWRtaW46QWRtaW5AMTIz");
        //                var response = await client.SendAsync(request);
        //                response.EnsureSuccessStatusCode();
        //                var jsonData = await response.Content.ReadAsStringAsync();
        //                RFIDToken token = JsonSerializer.Deserialize<RFIDToken>(jsonData);
        //                if (token != null) 
        //                    Session["rfidtoken"] = token;
        //            }
        //            catch (Exception ex)
        //            {

        //            }


        //        }


        //    }
        //    catch (Exception ex)
        //    {
        //        Console.Error.WriteLine(ex.Message);
        //    }


        //}
        public static string Base64Encode(string plainText)
        {
            var plainTextBytes = System.Text.Encoding.UTF8.GetBytes(plainText);
            return System.Convert.ToBase64String(plainTextBytes);
        }
        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
        public void SaveSession(string value)
        {
            Session["token"] = value;
        }
       
    }
}