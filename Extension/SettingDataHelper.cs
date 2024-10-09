using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using static Jabil.Controllers.SettingController;
using System.Web.Script.Serialization;
using Jabil.Models;

namespace Jabil.Extension
{
    public static class SettingDataHelper
    {
        
        public static SettingData GetDataFile()
        {
            var path = HttpContext.Current.Server.MapPath("~/assets/js/setting/SettingData.json");
            using (StreamReader reader = new StreamReader(path))
            {
                JavaScriptSerializer serializer = new JavaScriptSerializer();
                SettingData data = serializer.Deserialize<SettingData>(reader.ReadToEnd());
                return data;
            }
        }

        public static void SetDataFile(SettingData newData)
        {
            string newJson = JsonConvert.SerializeObject(newData);
            string filePath = HttpContext.Current.Server.MapPath("~/assets/js/setting/SettingData.json");
            File.WriteAllText(filePath, newJson);
        }
    }
}