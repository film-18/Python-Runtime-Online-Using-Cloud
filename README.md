# Python Runtime Online Using Cloud
Project Introduction to Cloud Technology

# Member:
1.62070011
2.62070082
3.62070135
4.62070223
5.62070160

# Detail and Process : 
Python Runtime Online เป็น website สำหรับ run Code ภาษา Python ในรูปแบบออนไลน์ โดยใช้ EC2 ของ AWS อยู่บน Cloud เป็น Virtual server เเทน Physical server รวมถึงสามารถบันทึกไฟล์บน cloud ซึ่งการสร้างหรือลบ EC2 ที่ใช้ run code เกิดจากการเข้ามาใช้งานบน website

1. เมื่อมี Request เข้ามาในส่วนของ Website จะทำการ Auto Scaling เพื่อไปที่ Master Node ซึ่งเป็น EC2 คอยเพิ่มลด EC2 เเละเลือก EC2 ที่จะใช้เเสดงผลกลับมาที่ website
2. ทำการเช็คทุก 1 นาที ว่าเป็น master node ถ้าเป็นจะคำนวณ จำนวน Request โดยที่ EC2 1 เครื่อง จะรับได้ 50 request ภายใน 10 นาที นับจากเวลาครั้งสุดท้ายที่ Request เข้ามา (Last response) โดยเก็บค่าไว้ที่ DynamoDB ถ้าไม่ได้ Request เข้ามาอีกครั้ง master node จะทำการ Terminate EC2 ตัวทีี่ใช้เเสดงผลหรือตัวที่ไม่ได้ใช้งานทั้งหมด 

# Video Present : 
[![Video present](https://i.imgur.com/vSjXE0C.jpg)](https://youtu.be/OB_9Wbp2IlM)

# AWS
 |     service    |   features          |
 | ---------------|---------------------|
 |       EC2      |   Resiliency        |
 |       S3       |   Scalable          |
 |    DynamoDB    |   High Availability |
 |                |   Load Balancing    |
 |                |   Auto Scaling      |
