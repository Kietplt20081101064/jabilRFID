using Jabil.Extension;
using Jabil.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;
using System.Web.Script.Serialization;
using static Jabil.Controllers.JabilAPIController;
using static Jabil.Controllers.SettingController;

namespace Jabil.Controllers
{
    public class JabilAPIController : Controller
    {
        private string url = SettingDataHelper.GetDataFile().ApiUrl;
        private string identificationId = SettingDataHelper.GetDataFile().identificationId;
        private string secretKey = SettingDataHelper.GetDataFile().secretKey;
        readonly DBEntities db = new DBEntities();
        // GET: JabilAPI
        public ActionResult Index()
        {  
            return View();
        }
        protected override JsonResult Json(object data, string contentType, System.Text.Encoding contentEncoding, JsonRequestBehavior behavior)
        {
            return new JsonResult()
            {
                Data = data,
                ContentType = contentType,
                ContentEncoding = contentEncoding,
                JsonRequestBehavior = behavior,
                MaxJsonLength = Int32.MaxValue
            };
        }
        public class Token
        {
            public string accessToken { get; set; }
            public string tokenType { get; set; }
            public object refreshToken { get; set; }
            public object idToken { get; set; }
            public int expiresIn { get; set; }
            public DateTime expiresTime { get; set; }
            public Token(string accessToken, string tokenType, object refreshToken, object idToken, int expiresIn)
            {
                this.accessToken = accessToken;
                this.tokenType = tokenType;
                this.refreshToken = refreshToken;
                this.idToken = idToken;
                this.expiresIn = expiresIn;
                this.expiresTime = DateTime.Now.AddSeconds(expiresIn);
            }
        }

        public async Task GetToken()
        {
            try
            { 
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, $"{url}/Auth/Token");
                var content = new StringContent("{\r\n  \"identificationId\": \""+identificationId+"\",\r\n  \"secretKey\": \""+secretKey+"\"\r\n}", null, "application/json");
                request.Content = content;
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var jsonData = await response.Content.ReadAsStringAsync();
                Token token = JsonSerializer.Deserialize<Token>(jsonData);
                Session["token"] = token;  
            }
            catch (Exception ex)
            {
               Console.Error.WriteLine(ex.Message);
            }         
        }
        public class JabilCustomer
        {
            public int Customer_ID { get; set; }
            public int Customer { get; set; }
            public string CustomerName { get; set; }
            public int Division { get; set; }
            public string DivisionName { get; set; }
            public string CustomerDivisionName { get; set; }
            public string SapIdentifier { get; set; }
            public bool ForceValidGrn { get; set; }
            public bool ProhibitLastPart { get; set; }
            public bool RequireQuickscan { get; set; }
            public int UserID_ID { get; set; }
            public DateTime LastUpdated { get; set; }
            public string CheckDate { get; set; }
            public bool Active { get; set; }
        }

        //Get customer list
        [HttpGet]
        public async Task<JsonResult> GetListCustomer()
        {
            try
            {
                CheckToken();
                var token = (Token)Session["token"];              
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post,$"{url}/Customer/ListCustomer");
                request.Headers.Add("Authorization", $"Bearer {token.accessToken}");
                var content = new StringContent("{\r\n  \"PartialKey\": \"\",\r\n  \"Active\": \"1\"\r\n}", null, "application/json");
                request.Content = content;
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var jsonArray = await response.Content.ReadAsStringAsync();

                var data = JsonSerializer.Deserialize<IList<JabilCustomer>>(jsonArray);

                if (data == null)
                {
                    return Json(new { Status = false },JsonRequestBehavior.AllowGet);
                }
                return Json(new { Status = true, Data =data.Where(d => d.Customer_ID != 0) }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { Status = false, e.Message },JsonRequestBehavior.AllowGet);
            }
            
        }
        public class Assembly
        {
            public int Assembly_ID { get; set; }
            public string AssemblyName { get; set; }
            public string Number { get; set; }
            public string Revision { get; set; }
            public string Version { get; set; }
            public int Descr { get; set; }
            public string Description { get; set; }
            public string Phantom { get; set; }
            public int BOM_ID { get; set; }
            public string Material { get; set; }
            public object EffectiveFrom { get; set; }
            public object EffectiveTo { get; set; }
            public bool Active { get; set; }
            public int Customer_ID { get; set; }
            public string CustomerText { get; set; }
            public int Panel_ID { get; set; }
            public string PanelName { get; set; }
            public int Family_ID { get; set; }
            public string FamilyName { get; set; }
            public int BarcodeMask_ID { get; set; }
            public string BarcodeMaskText { get; set; }
            public bool UseMultiPartBarCode { get; set; }
            public int UserID_ID { get; set; }
            public DateTime LastUpdated { get; set; }
            public string CheckDate { get; set; }
        }
        [HttpGet]
        public async Task<JsonResult> GetListAssembly(int CustomerID)
        {
            
            try
            {
                CheckToken();
                var token = (Token)Session["token"];
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, $"{url}/Assembly/ListAssembly");
                request.Headers.Add("Authorization", $"Bearer {token.accessToken}");
                var content = new StringContent("{\r\n  \"CustId\": \"" + CustomerID + "\",\r\n  \"Active\": \"1\",\r\n  \"PartialKey\": \"\"\r\n}", null, "application/json");
                request.Content = content;
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var jsonArray = await response.Content.ReadAsStringAsync();

                var list = JsonSerializer.Deserialize<IList<Assembly>>(jsonArray);

                if (list == null)
                {
                    return Json(new { status = false }, JsonRequestBehavior.AllowGet);
                }
                return Json(new { status = true, list }, "application/json", Encoding.UTF8, JsonRequestBehavior.AllowGet);

            }
            catch (Exception e)
            {
                return Json(new { status = false, message = e.Message }, JsonRequestBehavior.AllowGet);
            }

        }
        // Root myDeserializedClass = JsonConvert.DeserializeObject<Root>(myJsonResponse);
        public class EquipmentSetup
        {
            public int EquipmentSetup_ID { get; set; }
            public int RouteStep_ID { get; set; }
            public int Equipment_ID { get; set; }
            public int Assembly_ID { get; set; }
            public string Number { get; set; }
            public string Revision { get; set; }
            public string Version { get; set; }
            public string AssemblyText { get; set; }
            public string FactoryText { get; set; }
            public string MAText { get; set; }
            public string RouteText { get; set; }
            public string StepText { get; set; }
            public string CommonName { get; set; }
            public string Vendor { get; set; }
            public string Model { get; set; }
            public int BOM_ID { get; set; }
            public string SetupNumber { get; set; }
            public int SetupVersion { get; set; }
            public int TotalComponents { get; set; }
            public int TotalPins { get; set; }
            public bool Export { get; set; }
            public bool Active { get; set; }
            public string RFDisplay { get; set; }
            public string MachineName { get; set; }
            public string ProgramName { get; set; }
            public DateTime LoadDateTime { get; set; }
            public string Assembly { get; set; }
            public int CommonEquipmentSetup_ID { get; set; }
            public string CommonSetupName { get; set; }
            public int UserID_ID { get; set; }
            public DateTime CheckDate { get; set; }
        }


        [HttpGet]
        public async Task<JsonResult> GetListEquipmentSetups(int AssemblyID, int MachineID)
        {
            try
            {
                CheckToken();
                var token = (Token)Session["token"];
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, $"{url}/EquipmentSetup/GetActiveEquipmentSetupByAssemblyId");
                request.Headers.Add("Authorization", $"Bearer {token.accessToken}");
                var content = new StringContent("{\r\n  \"Assembly_ID\": \"" + AssemblyID + "\"\r\n}", null, "application/json");
                request.Content = content;
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var jsonArray = await response.Content.ReadAsStringAsync();

                var list = JsonSerializer.Deserialize<IList<EquipmentSetup>>(jsonArray);

                if (list == null)
                {
                    return Json(new { status = false },JsonRequestBehavior.AllowGet);
                }
                list = list.Where(e => e.Equipment_ID == MachineID).ToList();
                return Json(new { status = true, list }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { status = false, message = e.Message },JsonRequestBehavior.AllowGet);
            }
            
        }
        public class Setup
        {
            public int Block { get; set; }
            public string ComponentLocation { get; set; }
            public string Tray { get; set; }
            public string Track { get; set; }
            public string RequiredPart { get; set; }
            public string ActualPart { get; set; }
            public string Grn { get; set; }
            public string Action { get; set; }
        }


        [HttpGet]
        public async Task<JsonResult> GetSetupSheet(string ID)
        {
            //ID = "287408";
            //ID = "12822";
            try
            { 
                
                CheckToken();
                var token = (Token)Session["token"];
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, $"{url}/EquipmentSetup/SetupValidation");
                request.Headers.Add("Authorization", $"Bearer {token.accessToken}");
                var content = new StringContent("{\r\n  \"SetupId\": \""+ ID + "\"\r\n}", null, "application/json");
                request.Content = content;
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var jsonArray = await response.Content.ReadAsStringAsync();

                var list = JsonSerializer.Deserialize<IList<Setup>>(jsonArray);

                if (list == null)
                {
                    return Json(new { status = false },JsonRequestBehavior.AllowGet);
                }
                list =list.Where(l => l.Block == 1 ).OrderBy(l => l.ComponentLocation).ToList();
                return Json(new { status = true, list }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { status = false, message = e.Message },JsonRequestBehavior.AllowGet);
            }
            
        }

        public class SetupFeeder
        {
            public int Feeder_ID { get; set; }
                public int EquipmentSetup_ID { get; set; }
                public int CommonEquipmentSetup_ID { get; set; }
                public string CommonSetupName { get; set; }
                public int Equipment_ID { get; set; }
                public string Vendor { get; set; }
                public string Model { get; set; }
                public string CommonName { get; set; }
                public string MachineName { get; set; }
                public string ProgramName { get; set; }
                public DateTime LoadDateTime { get; set; }
                public int Assembly_ID { get; set; }
                public string Number { get; set; }
                public string Revision { get; set; }
                public string Version { get; set; }
                public string AssemblyText { get; set; }
                public int FeederTrayTrack_ID { get; set; }
                public string Feeder { get; set; }
                public string Tray { get; set; }
                public string Track { get; set; }
                public string FeederType { get; set; }
                public string Media { get; set; }
                public int Material_ID { get; set; }
                public string Material { get; set; }
                public string Descr { get; set; }
                public string CRDCount { get; set; }
                public string OutOfStock { get; set; }
                public string Deviation { get; set; }
                public string Change { get; set; }
                public string XFeeder { get; set; }
                public int UserID_ID { get; set; }
                public DateTime LastUpdated { get; set; }
                public DateTime CheckDate { get; set; }
                public DateTime EffectiveDateFrom { get; set; }
                public DateTime EffectiveDateTo { get; set; }
        }

        [HttpGet]
        public async Task<JsonResult> GetListFeederByEquipmentSetup(string ID)
        {
            
            try
            {
                CheckToken();
                var token = (Token)Session["token"];
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, $"{url}/EquipmentSetup/ListFeederByEquipmentSetup");
                request.Headers.Add("Authorization", $"Bearer {token.accessToken}");
                var content = new StringContent("\n\n\n{\r\n  \"SetupId\": \"" + ID + "\"\r\n}", null, "application/json");
                request.Content = content;
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var jsonArray = await response.Content.ReadAsStringAsync();

                var list = JsonSerializer.Deserialize<IList<SetupFeeder>>(jsonArray);

                if (list == null)
                {
                    return Json(new { status = false }, JsonRequestBehavior.AllowGet);
                }
                
                return Json(new { status = true, list }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { status = false, message = e.Message }, JsonRequestBehavior.AllowGet);
            }

        }
        public class GRNDetail
        {
            public int GRN_ID { get; set; }
            public string GRN { get; set; }
            public string MatDocNumber { get; set; }
            public string DateCode { get; set; }
            public string SeqNumber { get; set; }
            public int Material_ID { get; set; }
            public string Material { get; set; }
            public string Descr { get; set; }
            public string Vendor { get; set; }
            public bool ReelIsEmpty { get; set; }
            public bool SplitReelParent { get; set; }
            public bool SplitReelChild { get; set; }
            public bool MultiPartParent { get; set; }
            public bool MultiPartChild { get; set; }
            public int UserID_ID { get; set; }
            public DateTime LastUpdated { get; set; }
            public DateTime CheckDate { get; set; }
            public string SAPDateCode { get; set; }
            public string SAPLotCode { get; set; }
            public int ElapsedExposureTime { get; set; }
            public object BagOpened { get; set; }
            public object BagClosed { get; set; }
            public string BagStatus { get; set; }
            public object BakeIn { get; set; }
            public object BakeOut { get; set; }
            public object BakeStatus { get; set; }
            public int BakeTemperature { get; set; }
        }
        //[HttpGet]
        //public async Task<JsonResult> GetGRNByName(string GRN)
        //{
        //    using (var db = new DBEntities())
        //    {
        //        // Kiểm tra xem mã GRN có trong bảng ActiveGRNs hay không
        //        var activeGRN = db.ActiveGRNs.FirstOrDefault(g => g.GRN == GRN);
        //        if (activeGRN != null)
        //        {
        //            return Json(new { status = false, message = "GRN is currently being read" }, JsonRequestBehavior.AllowGet);
        //        }

        //        // Thêm mã GRN vào bảng ActiveGRNs
        //        db.ActiveGRNs.Add(new ActiveGRN { GRN = GRN });
        //        db.SaveChanges();

        //        // Gọi API Jabil để lấy chi tiết GRN
        //        try
        //        {
        //            CheckToken();
        //            var token = (Token)Session["token"];
        //            var client = new HttpClient();
        //            var request = new HttpRequestMessage(HttpMethod.Post, $"{url}/Material/GetGRNByName");
        //            request.Headers.Add("Authorization", $"Bearer {token.accessToken}");
        //            var content = new StringContent("{ \"grn\": \"" + GRN + "\" }", Encoding.UTF8, "application/json");
        //            request.Content = content;
        //            var response = await client.SendAsync(request);
        //            response.EnsureSuccessStatusCode();
        //            var jsonData = await response.Content.ReadAsStringAsync();

        //            var grn = JsonSerializer.Deserialize<GRNDetail>(jsonData);
        //            if (grn == null)
        //            {
        //                // Xóa mã GRN khỏi bảng ActiveGRNs nếu không thành công
        //                var failedGRN = db.ActiveGRNs.FirstOrDefault(g => g.GRN == GRN);
        //                if (failedGRN != null)
        //                {
        //                    db.ActiveGRNs.Remove(failedGRN);
        //                    db.SaveChanges();
        //                }
        //                return Json(new { status = false }, JsonRequestBehavior.AllowGet);
        //            }
        //            grn.Material = grn.Material.Replace("\n", "").Trim();

        //            // Xóa mã GRN khỏi bảng ActiveGRNs sau khi thành công
        //            var successfulGRN = db.ActiveGRNs.FirstOrDefault(g => g.GRN == GRN);
        //            if (successfulGRN != null)
        //            {
        //                db.ActiveGRNs.Remove(successfulGRN);
        //                db.SaveChanges();
        //            }

        //            return Json(new { status = true, grn }, JsonRequestBehavior.AllowGet);
        //        }
        //        catch (Exception e)
        //        {
        //            // Xóa mã GRN khỏi bảng ActiveGRNs nếu có lỗi xảy ra
        //            var erroredGRN = db.ActiveGRNs.FirstOrDefault(g => g.GRN == GRN);
        //            if (erroredGRN != null)
        //            {
        //                db.ActiveGRNs.Remove(erroredGRN);
        //                db.SaveChanges();
        //            }
        //            return Json(new { status = false, message = e.Message }, JsonRequestBehavior.AllowGet);
        //        }
        //    }
        //}
        [HttpGet]
        public async Task<JsonResult> GetGRNByName(string GRN)
        {

            try
            {
                CheckToken();
                var token = (Token)Session["token"];
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, $"{url}/Material/GetGRNByName");
                request.Headers.Add("Authorization", $"Bearer {token.accessToken}");
                var content = new StringContent("\n\n\n{\r\n  \"grn\": \"" + GRN + "\"\r\n}", null, "application/json");
                request.Content = content;
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var jsonData = await response.Content.ReadAsStringAsync();

                var grn = JsonSerializer.Deserialize<GRNDetail>(jsonData);

                if (grn == null)
                {
                    return Json(new { status = false }, JsonRequestBehavior.AllowGet);
                }
                grn.Material = grn.Material.Replace("\n", "").Trim();

                return Json(new { status = true, grn }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { status = false, message = e.Message }, JsonRequestBehavior.AllowGet);
            }

        }

        public class AddObject
        {
            public string UsrId { get; set; }
            public int SetupId { get; set; }
            public int EquipId { get; set; }
            public int FeederTrayTrackId { get; set; }
            public int GrnId { get; set; }
            public int Qty { get; set; }
            public int TranportId { get; set; }
            public string SetupFeederType { get; set; }
            public string LoadedFeederType { get; set; }
            public string Table { get; set; }
            public string Installed { get; set; }
            public string Lane { get; set; }
        }

        [HttpPost]
        public async Task<JsonResult> AddGrnToMES(AddObject data)
        {

            try
            {
                var user = (Account)Session["account"];
                data.UsrId = user.JabilID_ID;
                CheckToken();
                var stringData = new JavaScriptSerializer().Serialize(data);
                var token = (Token)Session["token"];
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, $"{url}/EquipmentSetup/EquipmentComponentAddPartByLane");
                request.Headers.Add("Authorization", $"Bearer {token.accessToken}");
                var content = new StringContent(new JavaScriptSerializer().Serialize(data), null, "application/json");
                request.Content = content;
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
               

                var message = await response.Content.ReadAsStringAsync();

                return Json(new { status = message == "success", message }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { status = false, message = e.Message }, JsonRequestBehavior.AllowGet);
            }

        }
        public class ClearObject
        {
            public string UsrId { get; set; }
            public int SetupId { get; set; }
            public int EquipId { get; set; }
            public string ClearMachine { get; set; }
            public string Table { get; set; }
            public string RemoveTransport { get; set; }
        }


        [HttpPost]
        public async Task<JsonResult> ClearSetupSheet(ClearObject data)
        {

            try
            {
                var user = (Account)Session["account"];
                data.UsrId = user.JabilID_ID;
                CheckToken();
                var stringData = new JavaScriptSerializer().Serialize(data);
                var token = (Token)Session["token"];
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, $"{url}/EquipmentSetup/ClearSetupTable");
                request.Headers.Add("Authorization", $"Bearer {token.accessToken}");
                var content = new StringContent(new JavaScriptSerializer().Serialize(data), null, "application/json");
                request.Content = content;
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
               
                var message = await response.Content.ReadAsStringAsync();
               
                 return Json(new { status = message == "success", message }, JsonRequestBehavior.AllowGet);

            }
            catch (Exception e)
            {
                return Json(new { status = false, message = e.Message }, JsonRequestBehavior.AllowGet);
            }

        }
        public class JabilMachine
        {
            public int Equipment_ID { get; set; }
            public int EquipmentMaster_ID { get; set; }
            public int Make { get; set; }
            public string Vendor { get; set; }
            public string Model { get; set; }
            public string CommonName { get; set; }
            public int SeqNumber { get; set; }
            public string AssetTag { get; set; }
            public string ManSerialNumber { get; set; }
            public bool Available { get; set; }
            public int EquipmentSetup_ID { get; set; }
            public int TableA { get; set; }
            public int TableB { get; set; }
            public double PPM { get; set; }
            public DateTime DateOfManufacture { get; set; }
            public double RunTimeHours { get; set; }
            public string SoftwareVersion { get; set; }
            public int Condition_ID { get; set; }
            public string ConditionText { get; set; }
            public int Status_ID { get; set; }
            public string StatusText { get; set; }
            public bool FeederTracking { get; set; }
            public bool FeederTypeValidation { get; set; }
            public int UserID_ID { get; set; }
            public DateTime LastUpdated { get; set; }
            public string CheckDate { get; set; }
        }


        [HttpGet]
        public async Task<JsonResult> GetEquipmentByName(string MachineName)
        {
            try
            {
                CheckToken();
                var token = (Token)Session["token"];
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, $"{url}/Equipment/GetEquipmentByName");
                request.Headers.Add("Authorization", $"Bearer {token.accessToken}");
                var content = new StringContent("{\r\n  \"equipmentName\": \""+ MachineName + "\"\r\n}", null, "application/json");
                request.Content = content;
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var jsonData = await response.Content.ReadAsStringAsync();

                var responseMachine = JsonSerializer.Deserialize<JabilMachine>(jsonData);

                if (responseMachine == null || responseMachine.Equipment_ID == 0)
                {
                    return Json(new { Status = false , message = "Machine is not valid!"}, JsonRequestBehavior.AllowGet);
                }
                var machine = db.Machines.Find(responseMachine.Equipment_ID);
                
                var data = new
                {
                    responseMachine.Equipment_ID,
                    responseMachine.Vendor,
                    responseMachine.Model,
                    responseMachine.CommonName,
                    machine?.FXReaders.FirstOrDefault()?.FXReaderID,
                    machine?.FXReaders.FirstOrDefault()?.FXReaderName,
                    IPAddress= machine?.FXReaders.FirstOrDefault()?.IPAddress.Trim()
                };
              

                return Json(new { Status = true, Data = data }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { Status = false, message = e.Message }, JsonRequestBehavior.AllowGet);
            }

        }
        public class JabilUser_ID
        {
            public int UserID_ID { get; set; }
            public string UserID { get; set; }
        }
        [HttpPost]
        public async Task<JsonResult> GetUserByWindowsId(string ntid)
        {

            try
            {
                CheckToken();
                var ntidObject = new
                {
                    ntid
                };
                var stringData = new JavaScriptSerializer().Serialize(ntidObject);
                var token = (Token)Session["token"];
                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Post, $"{url}/Security/GetUserByWindowsId");
                request.Headers.Add("Authorization", $"Bearer {token.accessToken}");
                var content = new StringContent(stringData, null, "application/json");
                request.Content = content;
                var response = await client.SendAsync(request);
                response.EnsureSuccessStatusCode();
                var jsonData = await response.Content.ReadAsStringAsync();
                JabilUser_ID jabilUser = null;
                //Bỏ qua lỗi khi không thể chuyển response về JabilUser_ID
                try
                {
                    jabilUser = JsonSerializer.Deserialize<JabilUser_ID>(jsonData);
                }
                catch (System.Text.Json.JsonException)
                {
                  
                }

                if(jabilUser == null)
                {
                    return Json(new { Status = false, Message = "User is not exist in MES!" }, JsonRequestBehavior.AllowGet);
                }
                return Json(new { Status = true, Data = jabilUser.UserID_ID }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { Status = false, e.Message }, JsonRequestBehavior.AllowGet);
            }

        }
       

        public void CheckToken()
        {
            var token = (Token)Session["token"];

            if (token == null ||(token.expiresTime - DateTime.Now ).TotalMinutes < 2  )
                _ = GetToken();
            
        }


    }
    
}