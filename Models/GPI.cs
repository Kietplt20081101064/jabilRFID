using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Jabil.Models
{
    public class DataGPI
    {
        public int pin { get; set; }
        public string state { get; set; }
    }

    public class GPI
    {
        public string component { get; set; }
        public DataGPI data { get; set; }
        public int eventNum { get; set; }
        public DateTime timestamp { get; set; }
        public string type { get; set; }
    }


}