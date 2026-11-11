import re

def convert_to_postgres_upsert(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # تقسيم المحتوى بناءً على أوامر UPDATE OR INSERT
    # هذا النمط يبحث عن اسم الجدول والأعمدة والقيم
    pattern = re.compile(r"UPDATE OR INSERT INTO (.*?) \((.*?)\) VALUES\s*(.*?);", re.DOTALL)
    matches = pattern.findall(content)

    with open(output_file, 'w', encoding='utf-8') as out:
        for table, columns, values in matches:
            # صياغة أمر Postgres Upsert
            upsert_query = f"INSERT INTO {table} ({columns})\nVALUES {values}\n"
            
            # في Postgres نحتاج لتحديد المفتاح الأساسي (عادة id) ليحدث التعارض
            # هنا نفترض أن المفتاح هو id، يمكنك تعديله إذا كان هناك جداول بمفاتيح أخرى
            upsert_query += "ON CONFLICT (id) DO UPDATE SET\n"
            
            # استخراج أسماء الأعمدة لتحديثها
            col_list = [c.strip().replace('"', '') for c in columns.split(',')]
            update_clauses = [f"{col} = EXCLUDED.{col}" for col in col_list if col != 'id']
            
            upsert_query += "    " + ",\n    ".join(update_clauses) + ";\n\n"
            out.write(upsert_query)

    print(f"تم إنشاء الملف بنجاح: {output_file}")

# تنفيذ التحويل
convert_to_postgres_upsert('C:\\Users\\sinaiwater\\Desktop\\Docker\\export_202606302144.sql', 'C:\\Users\\sinaiwater\\Desktop\\Docker\\cleaned_postgres_data.sql')