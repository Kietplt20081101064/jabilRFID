using Jabil.Extension;
using NinjaNye.SearchExtensions;
using OfficeOpenXml.Style;
using OfficeOpenXml;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Drawing;
using System.Data.Entity.Core.Common.CommandTrees.ExpressionBuilder;
using System.Globalization;

namespace Jabil.Controllers
{
    public class ReportController : Controller
    {
        DBEntities db = new DBEntities();
        // GET: Report
        public ActionResult Index()
        {
          
            return View();
        }
        public JsonResult GetReports(int? page, string search, string daterange, string machine, string createby, string setup, string assembly, string status)
        {
            try
            {
                var records = db.Records.Where(r => 
                    (string.IsNullOrEmpty(machine) || r.Machine.Contains(machine)) &&
                    (string.IsNullOrEmpty(createby) || r.Owner.Contains(createby)) &&
                    (string.IsNullOrEmpty(setup) || r.Setup.Contains(setup)) &&
                    (string.IsNullOrEmpty(assembly) || r.Assembly.Contains(assembly)) &&
                    (string.IsNullOrEmpty(status) || r.RecordType.Contains(status)))
                    .Select(r => new
                        {
                            r.RecordID,
                            r.Machine,
                            r.Owner,
                            r.Setup,
                            r.Assembly,
                            r.RecordType,
                            r.Datetime,
                            RecordDatas = r.RecordDatas.Select(d => new { d.GRN, d.PartNumber, d.Status })
                        });
                //Phân trang
                int pageSize = 10;
                page = (page > 0) ? page : 1;
                int start = (int)(page - 1) * pageSize;
                
                if (!string.IsNullOrEmpty(search))
                {
                    records = records.Search(u => u.RecordID.ToString(),
                                         u => u.Machine.ToLower(),
                                         u => u.Owner.ToLower(),
                                         u => u.Setup.ToLower(),
                                         u => u.Assembly.ToLower(),
                                         u => u.RecordType.ToLower()
                    ).Containing(search.ToLower());
                }
                if(!string.IsNullOrEmpty(daterange))
                {
                   DateTime? datefrom = ConvertStringToDatetime(daterange.Split('-')[0].Trim());
                   DateTime? dateto = ConvertStringToDatetime(daterange.Split('-')[1].Trim());
                    if(datefrom == null || dateto == null)
                    {
                        return Json(new { Status = false, Message = "DateRange is not valid" }, JsonRequestBehavior.AllowGet);
                    }
                    records = records.Where(r => r.Datetime >= datefrom && r.Datetime <= dateto);
                 
                }
                var data = records;
                ViewBag.pageCurrent = page;
                int totalBill = data.Count();
                float totalNumsize = (totalBill / (float)pageSize);

                int numSize = (int)Math.Ceiling(totalNumsize);
                ViewBag.numSize = numSize;
                data = data.OrderByDescending(d => d.Datetime).Skip(start).Take(pageSize);

                var fromto = PaginationExtension.FromTo(totalBill, (int)page, pageSize);

                int from = fromto.Item1;
                int to = fromto.Item2;
                return this.Json(
              new
              {
                  Status = true,
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
            catch (Exception e)
            {
                return Json(new { Status = false, Message = e.Message }, JsonRequestBehavior.AllowGet);
            }

        }
        public DateTime? ConvertStringToDatetime(string stringDate)
        {
            string dateString = stringDate;
            string format = "dd/MM/yyyy hh:mm tt";
            CultureInfo provider = CultureInfo.InvariantCulture;

            DateTime result;
            if (DateTime.TryParseExact(dateString, format, provider, DateTimeStyles.None, out result))
            {
                return result;
            }
            else
            {
                return null;
            }
        }
        public void ExportReports()
        {
            try
            {
                var result = db.Records.Select(r => new
                {
                    r.RecordID,
                    r.Machine,
                    r.Owner,
                    r.Setup,
                    r.Assembly,
                    r.RecordType,
                    r.Datetime,
                    RecordDatas = r.RecordDatas.Select(d => new { d.GRN, d.PartNumber, d.Status , d.Record.Datetime }).ToList().OrderByDescending(d => d.Datetime)
                }).ToList().OrderByDescending(r => r.Datetime);

                if (result.Count() > 0)
                {/// Report
                    ExcelPackage ep = new ExcelPackage();
                    ExcelWorksheet Sheet = ep.Workbook.Worksheets.Add("Report");
                    Sheet.Cells["A1"].Value = "Date Time";
                    Sheet.Cells["B1"].Value = "Machine";
                    Sheet.Cells["C1"].Value = "Create By";
                    Sheet.Cells["D1"].Value = "Setup";
                    Sheet.Cells["E1"].Value = "Assembly";
                    Sheet.Cells["F1"].Value = "Status";

                    //Detail report
                    ExcelWorksheet DetailSheet = ep.Workbook.Worksheets.Add("Detail Report");
                    DetailSheet.Cells["A1"].Value = "Date Time";
                    DetailSheet.Cells["B1"].Value = "Part Number";
                    DetailSheet.Cells["C1"].Value = "GRN";
                    DetailSheet.Cells["D1"].Value = "Status";
                    

                    int row = 2;// dòng bắt đầu ghi dữ liệu
                    int rowDetail = 2; // dòng bắt đầu ghi dữ liệu
                    
                    foreach (var item in result)
                    {
                        Sheet.Cells[string.Format("A{0}", row)].Value = item.Datetime.Value.ToString("dd/MM/yyyy HH:mm:ss");
                        Sheet.Cells[string.Format("B{0}", row)].Value = item.Machine;
                        Sheet.Cells[string.Format("C{0}", row)].Value = item.Owner;
                        Sheet.Cells[string.Format("D{0}", row)].Value = item.Setup;
                        Sheet.Cells[string.Format("E{0}", row)].Value = item.Assembly;
                        Sheet.Cells[string.Format("F{0}", row)].Value = item.RecordType;

                        //detail

                        if (item.RecordDatas.Count() > 0)
                        {
                            foreach (var detail in item.RecordDatas)
                            {
                                DetailSheet.Cells[string.Format("A{0}", rowDetail)].Value = detail.Datetime.Value.ToString("dd/MM/yyyy HH:mm:ss");
                                DetailSheet.Cells[string.Format("B{0}", rowDetail)].Value = detail.PartNumber;
                                DetailSheet.Cells[string.Format("C{0}", rowDetail)].Value = detail.GRN;
                                DetailSheet.Cells[string.Format("D{0}", rowDetail)].Value = detail.Status;

                                rowDetail++;
                            }
                            DetailSheet.Cells["A:AZ"].AutoFitColumns();
                            // Select only the header cells
                            var detailHeaderCells = DetailSheet.Cells[1, 1, 1, DetailSheet.Dimension.Columns];
                            DetailSheet.View.FreezePanes(2, 1);
                            detailHeaderCells.AutoFilter = true;
                            // Set their text to bold, italic and underline.
                            detailHeaderCells.Style.Font.Bold = true;
                            detailHeaderCells.Style.Fill.PatternType = ExcelFillStyle.Solid;
                            detailHeaderCells.Style.Font.Color.SetColor(Color.White);
                            detailHeaderCells.Style.Fill.BackgroundColor.SetColor(Color.Blue);
                            detailHeaderCells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;
                        }
                        //
                        row++;
                    }
                    Sheet.Cells["A:AZ"].AutoFitColumns();

                    // Select only the header cells
                    var headerCells = Sheet.Cells[1, 1, 1, Sheet.Dimension.Columns];
                    Sheet.View.FreezePanes(2, 1);
                    headerCells.AutoFilter = true;
                    // Set their text to bold, italic and underline.
                    headerCells.Style.Font.Bold = true;
                    headerCells.Style.Fill.PatternType = ExcelFillStyle.Solid;
                    headerCells.Style.Font.Color.SetColor(Color.White);
                    headerCells.Style.Fill.BackgroundColor.SetColor(Color.Blue);
                    headerCells.Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;


                    
                    Response.Clear();
                    Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                    string d = DateTime.Today.ToString("dd.MM.yy");

                    Response.AddHeader("content-disposition", "attachment; filename=" + "HistoryScan_Report_" + d + ".xlsx");
                    Response.BinaryWrite(ep.GetAsByteArray());
                    Response.End();


                }
            }
            catch (Exception ex)
            {
                var message = ex.Message;
            }

        }
       
    }
}