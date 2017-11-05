from elasticsearch import helpers, Elasticsearch
import csv

es = Elasticsearch()

with open('/Users/sbhowmik/Documents/Satyajit/Extra-Stuff/elasticsearch/data/Bihar.csv') as f:
    reader = csv.DictReader(f)
    helpers.bulk(es, reader, index='bihar', doc_type='company')