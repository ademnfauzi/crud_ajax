<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Barang extends CI_Controller {
    public function index(){
        $this->load->view('index');
    }
    public function getBarang(){
        $get = $this->b_m->getBarang();
        echo json_encode($get);
    }
    public function addBarang(){
        $rules = [
            [
                'field' => 'nama',
                'label' => 'Nama Barang',
                'rules' => 'required'
            ],
            [
                'field' => 'harga_satuan',
                'label' => 'Harga Satuan',
                'rules' => 'required'
            ],
            [
                'field' => 'jumlah',
                'label' => 'Jumlah',
                'rules' => 'required'
            ],
            [
                'field' => 'keterangan',
                'label' => 'Keterangan',
                'rules' => 'required'
            ],
        ];
        $this->form_validation->set_rules($rules);
        if ($this->form_validation->run() == false) {
            # code...
            $data = [
                'nama' => form_error('nama'),
                'harga_satuan' => form_error('harga_satuan'),
                'jumlah' => form_error('jumlah'),
                'keterangan' => form_error('keterangan')
            ];
            echo json_encode($data);
        } else {
            $this->b_m->addBarang();
            echo json_encode('sukses');
            }
        }
    public function getIdBarang()
    {
        $id = $this->input->post('id');
        $where = [
            'id' => $id
        ];
        $dataBarang = $this->b_m->getBarangById('barang',$where)->result();
        echo json_encode($dataBarang);
    }
    public function updateData(){
        $id = $this->input->post('id');
        $rules = [
            [
                'field' => 'id',
                'label' => 'ID',
                'rules' => 'required'
            ],
            [
                'field' => 'nama',
                'label' => 'Nama Barang',
                'rules' => 'required'
            ],
            [
                'field' => 'harga_satuan',
                'label' => 'Harga Satuan',
                'rules' => 'required'
            ],
            [
                'field' => 'jumlah',
                'label' => 'Jumlah',
                'rules' => 'required'
            ],
            [
                'field' => 'keterangan',
                'label' => 'Keterangan',
                'rules' => 'required'
            ],
        ];
        $this->form_validation->set_rules($rules);
        if ($this->form_validation->run() == false) {
            # code...
            $data = [
                'id' => form_error('id'),
                'nama' => form_error('nama'),
                'harga_satuan' => form_error('harga_satuan'),
                'jumlah' => form_error('jumlah'),
                'keterangan' => form_error('keterangan')
            ];
            echo json_encode($data);
        } else {
            $this->b_m->updateBarang();
            echo json_encode('sukses');
            }
    }

    public function deleteData(){
        $id = $this->input->post('id');
        $where = [
            'id' => $id
        ];
        $this->b_m->deleteData($where,'barang');
     }
}