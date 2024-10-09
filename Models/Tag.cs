using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Jabil.Models
{
   
    public class Data
    {
        public int eventNum { get; set; }
        public string format { get; set; }
        public string idHex { get; set; }
        public string userDefined { get; set; }
    }

    public class Tag
    {
        public Data data { get; set; }
        public DateTime timestamp { get; set; }
        public string type { get; set; }
    }
}