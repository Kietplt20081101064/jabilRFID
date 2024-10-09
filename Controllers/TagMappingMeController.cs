using Jabil.Extension;
using NinjaNye.SearchExtensions;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.ServiceModel.Channels;
using System.Web;
using System.Web.Mvc;

namespace Jabil.Controllers
{
    public class TagMappingMeController : Controller
    {
        DBEntities db = new DBEntities();
        // GET: TagMapping
        public ActionResult Index()
        {
            return View();
        }
        [HttpGet]
        public JsonResult GetTagMapping(string search, int page)
        {
            var list = db.GrnOfEpcs.Select(t => new {
                GRN = string.IsNullOrEmpty(t.GRN) ? "Unassigned Tag" : t.GRN,
                t.EPC,
                t.MapDate
            });

            if (!string.IsNullOrEmpty(search))
            {
                list = list.Search(x => x.GRN.ToLower(),
                                   x => x.EPC.ToLower()).Containing(search.ToLower());
            }

            //Phân trang
            int pageSize = 10;
            page = (page > 0) ? page : 1;
            int start = (int)(page - 1) * pageSize;
            var data = list;
            ViewBag.pageCurrent = page;
            int totalBill = data.Count();
            float totalNumsize = (totalBill / (float)pageSize);

            int numSize = (int)Math.Ceiling(totalNumsize);
            ViewBag.numSize = numSize;
            data = data.OrderByDescending(d => d.MapDate).Skip(start).Take(pageSize);

            var fromto = PaginationExtension.FromTo(totalBill, (int)page, pageSize);

            int from = fromto.Item1;
            int to = fromto.Item2;
            return this.Json(
          new
          {
              data,
              pageCurrent = page,
              numSize,
              total = totalBill,
              size = pageSize,
              from,
              to

          }
          , JsonRequestBehavior.AllowGet
          );
        }
        [HttpPost]
        public JsonResult MappingTag(GrnOfEpc mappingTag)
        {
            try
            {
                if (string.IsNullOrEmpty(mappingTag.EPC) || string.IsNullOrEmpty(mappingTag.GRN))
                {
                    // Xuất thông báo lỗi nếu FXReaderID hoặc IPAddress rỗng
                    return Json(new { status = false, message = "Data is not valid!" }, JsonRequestBehavior.AllowGet);

                }
                var GrnExist = db.GrnOfEpcs.FirstOrDefault(m => m.GRN.Equals(mappingTag.GRN));
                var EpcExist = db.GrnOfEpcs.FirstOrDefault(m => m.EPC.Equals(mappingTag.EPC));

                if (GrnExist != null && EpcExist != null)
                {
                    if (GrnExist == EpcExist)
                    {
                        return Json(new { status = true }, JsonRequestBehavior.AllowGet);
                    }
                    else
                    {
                        return Json(new { status = false, message = $"GRN:{GrnExist.GRN} is mapped with EPC:{GrnExist.EPC}, please change and try again!" }, JsonRequestBehavior.AllowGet);

                    }
                }
                else if (GrnExist != null)
                {
                    return Json(new { status = false, message = $"GRN:{GrnExist.GRN} is mapped with EPC:{GrnExist.EPC}, please change and try again!" }, JsonRequestBehavior.AllowGet);

                }
                else if (EpcExist != null)
                {
                    EpcExist.GRN = mappingTag.GRN;
                    EpcExist.MapDate = DateTime.Now;
                }
                else
                {
                    mappingTag.MapDate = DateTime.Now;
                    db.GrnOfEpcs.Add(mappingTag);
                }
                db.SaveChanges();

                return Json(new { status = true }, JsonRequestBehavior.AllowGet);

            }
            catch (Exception ex)
            {
                return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult MappingTags(List<GrnOfEpc> mappingTags)
        {
            try
            {
                foreach (var mappingTag in mappingTags)
                {
                    if (string.IsNullOrEmpty(mappingTag.EPC) || string.IsNullOrEmpty(mappingTag.GRN))
                    {
                        // Xuất thông báo lỗi nếu FXReaderID hoặc IPAddress rỗng
                        return Json(new { status = false, message = "Data is not valid!" }, JsonRequestBehavior.AllowGet);

                    }
                    var GrnExist = db.GrnOfEpcs.FirstOrDefault(m => m.GRN.Equals(mappingTag.GRN));
                    var EpcExist = db.GrnOfEpcs.FirstOrDefault(m => m.EPC.Equals(mappingTag.EPC));
                    if (GrnExist != null && EpcExist != null)
                    {
                        if (GrnExist == EpcExist)
                        {
                            return Json(new { status = true }, JsonRequestBehavior.AllowGet);
                        }
                        else
                        {
                            return Json(new { status = false, message = $"GRN:{GrnExist.GRN} is mapped with EPC:{GrnExist.EPC}, please change and try again!" }, JsonRequestBehavior.AllowGet);

                        }
                    }
                    else if (GrnExist != null)
                    {
                        return Json(new { status = false, message = $"GRN:{GrnExist.GRN} is mapped with EPC:{GrnExist.EPC}, please change and try again!" }, JsonRequestBehavior.AllowGet);

                    }
                    else if (EpcExist != null)
                    {
                        EpcExist.GRN = mappingTag.GRN;
                        EpcExist.MapDate = DateTime.Now;
                    }
                    else
                    {
                        mappingTag.MapDate = DateTime.Now;
                        db.GrnOfEpcs.Add(mappingTag);
                    }

                }
                db.SaveChanges();

                return Json(new { status = true }, JsonRequestBehavior.AllowGet);

            }
            catch (Exception ex)
            {
                return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        [HttpPost]
        public JsonResult UnMap(string id)
        {
            try
            {
                var mappingtag = db.GrnOfEpcs.Where(x => x.EPC == id).FirstOrDefault();
                if (mappingtag != null)
                {
                    mappingtag.GRN = null;
                    db.SaveChanges();
                    return Json(new { status = true }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { status = false, message = "Tag does not exist!" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
        [HttpPost]
        public JsonResult DeleteTag(string id)
        {
            try
            {
                var mappingtag = db.GrnOfEpcs.Where(x => x.EPC == id).FirstOrDefault();
                if (mappingtag != null)
                {
                    db.GrnOfEpcs.Remove(mappingtag);
                    db.SaveChanges();
                    return Json(new { status = true }, JsonRequestBehavior.AllowGet);
                }
                else
                {
                    return Json(new { status = false, message = "Tag does not exist!" }, JsonRequestBehavior.AllowGet);
                }
            }
            catch (Exception ex)
            {
                return Json(new { status = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }
      
        }
    }
