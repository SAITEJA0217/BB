from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base
import datetime

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    pages = Column(Integer)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    file_size = Column(Integer, default=0)
    file_hash = Column(String, index=True, nullable=True)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    pdf_name = Column(String, index=True)
    page_number = Column(Integer)
    chapter = Column(String, nullable=True)
    unit = Column(String, nullable=True)
    heading = Column(String, nullable=True)
    paragraph_number = Column(Integer)
    content = Column(Text)

class Bookmark(Base):
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    pdf_name = Column(String)
    page_number = Column(Integer)
    heading = Column(String, nullable=True)
    content = Column(Text)
    date_saved = Column(DateTime, default=datetime.datetime.utcnow)

class SearchHistory(Base):
    __tablename__ = "search_history"
    
    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
