using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Jabil.Extension
{
    public class PaginationExtension
    {
        public static (int from, int to) FromTo(int product_count, int page_num, int pagesize)
        {

            int page_from = (page_num - 1) * pagesize + 1;
            int page_to = 0;
            if (product_count - page_num * pagesize > 0)
            {
                page_to = page_num * pagesize;
            }
            else
                page_to = product_count;



            return (page_from, page_to);
        }
    }
}