using Jabil.Models;
using Microsoft.AspNet.SignalR;
using System;
using System.Collections.Generic;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net.Http;
using System.Security.Policy;
using System.Text.Json;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using static Jabil.Controllers.JabilAPIController;
using System.Web.Script.Serialization;
using System.Net;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNet.SignalR.Hosting;
using System.Text;
using System.Web.Http.Results;
using System.IdentityModel.Tokens.Jwt;
using System.Threading;
using System.Diagnostics;
namespace Jabil.Controllers
{
    [AllowAnonymous]
    public class RFIDController : Controller
    {
        private readonly DBEntities db = new DBEntities();
        
        // GET: RFID

        public ActionResult Index()
        {
            return View();
        }
        [HttpGet]
        public JsonResult AllShowEPC()
        {
            try
            {
                var machine = ((Machine)Session["Machine"]); 
                if(machine == null)
                {
                    return Json(new { status = false, message = $"Error: Machine is not valid to read"}, JsonRequestBehavior.AllowGet);
                }
                var FxReader = machine.FXReaders.FirstOrDefault();
                if(FxReader == null)
                {
                    return Json(new { status = false, message = $"Error: Machine is not mapping with any FXReader" }, JsonRequestBehavior.AllowGet);
                }
                
                var tags = db.LiveTags.Where(t => t.FXReader.Trim().Equals(FxReader.FXReaderID.Trim())).Select(t => new {
                    epc = db.GrnOfEpcs.Any(a => a.EPC.Equals(t.EPC)) ?
                                            (string.IsNullOrEmpty(db.GrnOfEpcs.FirstOrDefault(a => a.EPC.Equals(t.EPC)).GRN) ? "Unassigned Tag" : db.GrnOfEpcs.FirstOrDefault(a => a.EPC.Equals(t.EPC)).GRN)
                                            : "Unknow Tag"
                }).ToList();
                return Json(new { status = true, a= tags }, JsonRequestBehavior.AllowGet);
            }

            catch (Exception e)
            {
                return Json(new { status = false, message = "Error !!!" + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        
        [HttpPost]
        public JsonResult falseEPC(string epc)
        {
            try
            {
                var deepc = db.LiveTags.Find(epc);
                if (deepc == null)
                {
                    return Json(new { code = 500, msg = "Strange Tag" }, JsonRequestBehavior.AllowGet);
                }
                deepc.Status = false;
                db.SaveChanges();
                return Json(new { code = 200, }, JsonRequestBehavior.AllowGet);

            }
            catch (Exception e)
            {
                return Json(new { code = 500, msg = "Sai !!!" + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        [HttpPost]
        public string Post(Tag[] tags)
        {

            foreach (var tag in tags)
            {
                LiveTag t = new LiveTag
                {
                    EPC = tag.data.idHex,
                    FXReader = tag.data.userDefined,
                    Status = true,
                    ReadAt = DateTime.Now,
                };

                if (!db.LiveTags.Any(x => x.EPC.Equals(tag.data.idHex)))
                    db.LiveTags.Add(t);
                db.SaveChanges();
            }
           
           
            return "";
        }
        
       public class GPINoti
        {
           public string IP { get; set;}
           public bool Status { get; set;}

        }
        [HttpPost]
        public void GPIStatus(GPI gpi)
        {
            if (gpi != null)
            {
                string ReaderIP = GetIPAddress();
                //ReaderIP = "10.124.218.34";
                var gpiHub = GlobalHost.ConnectionManager.GetHubContext<GpiHub>();
                
                if (!string.IsNullOrEmpty(ReaderIP) && db.FXReaders.Any(r => r.IPAddress.Trim().Equals(ReaderIP)))
                {
                    GPINoti noti = new GPINoti
                    {
                        IP = ReaderIP
                    };
                    string FxName = db.FXReaders.FirstOrDefault(f => f.IPAddress.Equals(ReaderIP)).FXReaderID.Trim();
                    if (!db.LiveGPIs.Any(g => g.FXReader.Equals(FxName)))
                    {
                        LiveGPI GPI = new LiveGPI
                        {
                            Status = gpi.data.state.Equals("LOW"),
                            FXReader = FxName
                        };    
                        db.LiveGPIs.Add(GPI);
                        noti.Status = gpi.data.state.Equals("LOW");
                        gpiHub.Clients.All.notify(noti);
                    }
                    else
                    {
                        var GPI = db.LiveGPIs.FirstOrDefault(g => g.FXReader.Equals(FxName));
                        var stt = gpi.data.state.Equals("LOW");
                        if(stt != GPI.Status) {
                            GPI.Status = stt;
                            noti.Status = stt;
                            gpiHub.Clients.All.notify(noti);

                        }
                       
                    
                    }
                }
              
                db.SaveChanges();
            }
             
        }
        [HttpPost]
        public JsonResult DeleteEPC()
        {
            try
            {
                var machine = ((Machine)Session["Machine"]);
                if (machine == null)
                {
                    return Json(new { Status = false, message = $"Error: Machine is not valid to read" }, JsonRequestBehavior.AllowGet);
                }
                var FxReader = machine.FXReaders.FirstOrDefault();
                if (FxReader == null)
                {
                    return Json(new { Status = false, Message = $"Error: Machine is not mapping with any FXReader" }, JsonRequestBehavior.AllowGet);
                }
                var FX = FxReader.FXReaderName.Trim();
                var countDeEpc = db.LiveTags.Where(x => x.EPC.Length > 0 && x.FXReader == FX).ToList();
                db.LiveTags.RemoveRange(countDeEpc);
                db.SaveChanges();
                bool saveFailed;
                do
                {
                    saveFailed = false;

                    try
                    {
                        db.SaveChanges();
                    }
                    catch (DbUpdateConcurrencyException ex)
                    {
                        saveFailed = true;

                        // Update the values of the entity that failed to save from the store
                        ex.Entries.Single().Reload();
                    }

                } while (saveFailed);
                
                return Json(new { Status = true}, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { status = false, msg = e.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        
        public string GetIPAddress()
        {
            HttpContext context = System.Web.HttpContext.Current;
            string ipAddress = context.Request.ServerVariables["HTTP_X_FORWARDED_FOR"];

            if (!string.IsNullOrEmpty(ipAddress))
            {
                string[] addresses = ipAddress.Split(',');
                if (addresses.Length != 0)
                {
                    return addresses[0];
                }
            }

            return context.Request.ServerVariables["REMOTE_ADDR"];
        }

        //[HttpPost]
        //public JsonResult SaveRecord(Record record, List<RecordData> sheet)
        //{
        //    Account user = (Account)Session["account"];
        //    var response = new JsonResponse();
        //    try
        //    {
        //        if (record == null )
        //        {
        //            response.Status = false;
        //            response.Message = "Data is not valid!";
        //        }

        //        else
        //        {
        //            record.Datetime = DateTime.Now;
        //            record.Owner = user.FullName;
        //            if(record.RecordType == "Success" || record.RecordType == "Fail")
        //            {
        //                if(sheet.Count > 0)
        //                record.RecordDatas = sheet;
        //                else
        //                {
        //                    response.Status = false;
        //                    response.Message = "Data is not valid!";
        //                }
        //            }              
        //            db.Records.Add(record);
        //            db.SaveChanges();
        //            response.Status = true;
        //        }


        //    }
        //    catch (Exception ex)
        //    {
        //        response.Status = false;
        //        response.Message = ex.Message;
        //    }
        //    return Json(response, JsonRequestBehavior.AllowGet);
        //}
        //[HttpPost]
        //public JsonResult SaveActiveGRNs(List<RecordData> sheet, string machine)
        //{
        //    bool status = false;
        //    string message = "Failed to save Active GRNs.";

        //    try
        //    {
        //        using (var db = new DBEntities())
        //        {
        //            foreach (var recordData in sheet)
        //            {
        //                var existingGRN = db.ActiveGRNs.SingleOrDefault(g => g.GRN == recordData.GRN);

        //                if (existingGRN == null)
        //                {
        //                    db.ActiveGRNs.Add(new ActiveGRN
        //                    {
        //                        GRN = recordData.GRN,
        //                        PartNumber = recordData.PartNumber,
        //                        Machine = machine,
        //                        CreatedAt = DateTime.Now
        //                    });
        //                }
        //            }

        //            db.SaveChanges();

        //            status = true;
        //            message = "Active GRNs saved successfully.";
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        message = ex.Message;
        //    }

        //    return Json(new { Status = status, Message = message });
        //}
        public class JsonResponse
        {
            public bool Status { get; set; }
            public string Message { get; set; }
        }
        [HttpGet]
        //public JsonResult CheckActiveGRN(string GRN)
        //{
        //    var response = new
        //    {
        //        Status = false,
        //        Message = "GRN has not been used or machine details not available."
        //    };

        //    try
        //    {
        //        using (var db = new DBEntities())
        //        {
        //            var activeGRN = db.ActiveGRNs.SingleOrDefault(g => g.GRN == GRN);

        //            if (activeGRN != null)
        //            {
        //                response = new
        //                {
        //                    Status = true,
        //                    Message = $"GRN is used in machine: {activeGRN.Machine}."
        //                };
        //            }
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        response = new
        //        {
        //            Status = false,
        //            Message = ex.Message
        //        };
        //    }

        //    return Json(response, JsonRequestBehavior.AllowGet);
        //}
        [HttpPost]
        public JsonResult SaveRecord(Record record, List<RecordData> sheet)
        {
            Account user = (Account)Session["account"];
            var response = new JsonResponse();
            try
            {
                if (record == null)
                {
                    response.Status = false;
                    response.Message = "Data is not valid!";
                }

                else
                {
                    record.Datetime = DateTime.Now;
                    record.Owner = user.FullName;
                    if (record.RecordType == "Success" || record.RecordType == "Fail")
                    {
                        if (sheet.Count > 0)
                            record.RecordDatas = sheet;
                        else
                        {
                            response.Status = false;
                            response.Message = "Data is not valid!";
                        }
                    }
                    db.Records.Add(record);
                    db.SaveChanges();
                    if (record.RecordType == "Success")
                    {
                        //SaveActiveGRNs(sheet, record.Machine);
                    }
                    response.Status = true;
                }


            }
            catch (Exception ex)
            {
                response.Status = false;
                response.Message = ex.Message;
            }
            return Json(response, JsonRequestBehavior.AllowGet);
        }

        internal static bool ValidateServerCertificate(object sender, System.Security.Cryptography.X509Certificates.X509Certificate certificate, X509Chain chain, SslPolicyErrors sslPolicyErrors)
        {
            return true;
        }
        // Sử dụng client timeout trong 3s 
        private static readonly HttpClient client = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(3)
        };
        [HttpGet]
        public async Task<JsonResult> GetRFIDToken()
        {
            try
            {
                
                Machine machine = (Machine) Session["Machine"];
                var FX = machine.FXReaders.FirstOrDefault();
                
                if (machine != null)
                {
                    if (FX != null) 
                    {
                        try
                        {
                            var url = FX.IPAddress.Trim();
                            //var client = client;
                            var request = new HttpRequestMessage(HttpMethod.Get, $"https://{url}/cloud/localRestLogin");
                            request.Headers.Add("Authorization", "Basic YWRtaW46QWRtaW5AMTIz");
                            var response = await client.SendAsync(request);
                          
                            response.EnsureSuccessStatusCode();
                          
                            var jsonData = await response.Content.ReadAsStringAsync();
                            RFIDToken rfidToken = JsonSerializer.Deserialize<RFIDToken>(jsonData);
                            var handler = new JwtSecurityTokenHandler();
                            var token = handler.ReadJwtToken(rfidToken.message);
                            var expirationUnix = token.Claims.First(claim => claim.Type == "exp").Value;
                            var expirationTime = DateTimeOffset.FromUnixTimeSeconds(long.Parse(expirationUnix)).DateTime;
                            Session["rfidtoken"] = rfidToken;
                            return Json(new { Status = true ,IP = url }, JsonRequestBehavior.AllowGet);
                        }
                        
                        catch (Exception ex)
                        {
                            return Json(new { Status = false, Message = "Fail to connect with FX" }, JsonRequestBehavior.AllowGet);

                        }
                    }
                    else
                    {
                        return Json(new { Status = false, Message = "Machine is not map to any FXReader! Please select machine again!" }, JsonRequestBehavior.AllowGet);
                    }


                }
                else
                {
                    return Json(new { Status = false,
                        Message = "Machine is not valid! Please select machine again!" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { Status = false,
                    Message = ex.Message },JsonRequestBehavior.AllowGet);
            }


        }

        public class RFIDToken
        {
            public int code { get; set; }
            public string message { get; set; }
        }
       
        public class SetUpLightObject
        {
            public int port { get; set; }
            //public bool state { get; set; }
            public bool status { get; set; }
        }
        public async Task<JsonResult> SetUpLight(SetUpLightObject data)
        {
            try
            {
                // Kiểm tra tài khoản trong session
                Account account = (Account)Session["account"];
                if (account == null)
                {
                    return Json(new { status = false, message = "Account not found in session." });
                }

                // Tìm FXReader dựa trên tài khoản
                var FX = db.FXReaders.Find(account.FXReader);
                if (FX == null)
                {
                    return Json(new { status = false, message = "FXReader not found." });
                }

                // Lấy địa chỉ IP của FXReader
                string url = FX.IPAddress.ToString().Trim();
                if (string.IsNullOrWhiteSpace(url))
                {
                    return Json(new { status = false, message = "Invalid FXReader IP address." });
                }

                // Kiểm tra và lấy token RFID
                RFIDToken token = (RFIDToken)Session["rfidtoken"];
                if (token == null)
                {
                    if (!CheckRFIDToken())
                    {
                        return Json(new { status = false, message = "RFID token retrieval failed." });
                    }

                    token = (RFIDToken)Session["rfidtoken"];
                    if (token == null)
                    {
                        return Json(new { status = false, message = "RFID token not found in session after checking." });
                    }
                }

                var client = new HttpClient();
                var request = new HttpRequestMessage(HttpMethod.Put, $"https://{url}/cloud/gpo");
                request.Headers.Add("Authorization", $"Bearer {token.message}");
                var gpoObject = new
                {
                    port = data.port,
                    state = data.status // Chuyển đổi từ "status" sang "state" để khớp với định dạng JSON mong đợi
                };
                var json = System.Text.Json.JsonSerializer.Serialize(gpoObject);

                var content = new StringContent(json, Encoding.UTF8, "application/json");
                request.Content = content;

                // Gửi yêu cầu và nhận phản hồi
                var response = await client.SendAsync(request);
                var result = await response.Content.ReadAsStringAsync();

                // Nếu phản hồi rỗng, xác định màu sắc đèn dựa trên port
                if (string.IsNullOrWhiteSpace(result))
                {
                    // Lấy trạng thái gần nhất của record có trạng thái Success, Fail, hoặc Stop
                    var latestRecord = db.Records
                        .Where(r => r.RecordType == "Success" || r.RecordType == "Fail" || r.RecordType == "Stop")
                        .OrderByDescending(r => r.Datetime) // Sắp xếp giảm dần theo thời gian
                        .FirstOrDefault();

                    string lightColor = "red"; // Mặc định là màu do
                    if (latestRecord != null)
                    {
                        switch (latestRecord.RecordType)
                        {
                            case "Success":
                                lightColor = "green";
                                break;
                            case "Fail":
                                lightColor = "red";
                                break;
                            case "Stop":
                                lightColor = "yellow";
                                break;
                        }
                    }

                    return Json(new { status = true, port = data.port, message = $"Light {lightColor} successfully changed with empty server response." });
                }

                // Thử giải mã JSON từ phản hồi
                RFIDToken res = null;
                try
                {
                    res = System.Text.Json.JsonSerializer.Deserialize<RFIDToken>(result);
                }
                catch (JsonException ex)
                {
                    Debug.WriteLine("JSON Deserialization Error: " + ex.Message);
                    return Json(new { status = false, message = "Error deserializing response: " + ex.Message });
                }

                // Kiểm tra mã phản hồi từ server
                if (res != null)
                {
                    if (res.code == 1 || res.code == 2 || res.code == 3)
                    {
                        string lightColor;
                        switch (data.port)
                        {
                            case 1:
                                lightColor = "green";
                                break;
                            case 2:
                                lightColor = "red";
                                break;
                            case 3:
                                lightColor = "yellow";
                                break;
                            default:
                                lightColor = "red";
                                break;
                        }

                        return Json(new { status = true, port = data.port, message = $"Light {lightColor} successfully changed." });
                    }
                    else
                    {
                        return Json(new { status = false, port = data.port, message = "Failed to change light. Response code: " + res.code });
                    }
                }
                else
                {
                    // Nếu res là null, giả định rằng hành động thành công dựa trên trạng thái
                    string lightColor;
                    switch (data.port)
                    {
                        case 1:
                            lightColor = "green";
                            break;
                        case 2:
                            lightColor = "red";
                            break;
                        case 3:
                            lightColor = "yellow";
                            break;
                        default:
                            lightColor = "red";
                            break;
                    }

                    return Json(new { status = true, port = data.port, message = $"Light {lightColor} successfully changed with null response from server." });
                }
            }
            catch (Exception e)
            {
                return Json(new { status = false, message = "Exception: " + e.Message });
            }
        }

        public bool CheckRFIDToken()
        {
            return (Session["rfidtoken"] == null);
            
        }

        



        ///  Mapping Tag
        [HttpGet]
        public JsonResult NewestShowEPC(string id)
        {
            try
            {
                Account account = (Account)Session["account"];
                var FX = db.FXReaders.Find(id);
                if (FX == null)
                {
                    return Json(new { status = false, message = "Reader is not valid please try again!" }, JsonRequestBehavior.AllowGet);
                }
                var tags = db.LiveTags.Where(t => t.FXReader.Trim().Equals(FX.FXReaderID)).OrderByDescending(t => t.ReadAt).Select(t => new
                {
                    epc = t.EPC
                }).ToList();
                if (!tags.Any())
                {
                    return Json(new { status = false, message = "Nothing to read!" }, JsonRequestBehavior.AllowGet);

                }
                if (tags.Count() > 1)
                {
                    return Json(new { status = false, message = "More than 1 tag was read, please check!" }, JsonRequestBehavior.AllowGet);
                }
                return Json(new { status = true, epc = tags.FirstOrDefault().epc }, JsonRequestBehavior.AllowGet);

            }

            catch (Exception e)
            {
                return Json(new { code = 500, msg = "Sai !!!" + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpGet]
        public JsonResult GetEPCForMapping(string id)
        {
            try
            { 
                var FxReader = db.FXReaders.Find(id);
                if (FxReader == null)
                {
                    return Json(new { status = false, message = "Reader is not valid please try again!" }, JsonRequestBehavior.AllowGet);
                }
                var tx = db.LiveTags.ToList();
                var tags = db.LiveTags.Where(t => t.FXReader.Trim().Equals(FxReader.FXReaderID.Trim())).Select(t => new {
                    epc = t.EPC.Trim()
                }).ToList();
                return Json(new { status = true, a = tags }, JsonRequestBehavior.AllowGet);
            }

            catch (Exception e)
            {
                return Json(new { status = false, message = "Error !!!" + e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult DeleteEPCForMapping(string id)
        {
            try
            {
                Account account = (Account)Session["account"];
                var FX = db.FXReaders.Find(id).FXReaderID;
                var countDeEpc = db.LiveTags.Where(x => x.EPC.Length > 0 && x.FXReader == FX).ToList();
                db.LiveTags.RemoveRange(countDeEpc);
                db.SaveChanges();
                bool saveFailed;
                do
                {
                    saveFailed = false;

                    try
                    {
                        db.SaveChanges();
                    }
                    catch (DbUpdateConcurrencyException ex)
                    {
                        saveFailed = true;

                        // Update the values of the entity that failed to save from the store
                        ex.Entries.Single().Reload();
                    }

                } while (saveFailed);

                return Json(new { status = true }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception e)
            {
                return Json(new { status = false, msg = e.Message }, JsonRequestBehavior.AllowGet);
            }
        }

    }
}